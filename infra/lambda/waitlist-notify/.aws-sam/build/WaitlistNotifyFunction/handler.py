"""
Waitlist owner notification via Amazon SES.

Event (direct invoke from Django): {"fullName": "...", "email": "..."}
API Gateway HTTP API: body may be JSON string; parsed below.

Environment:
  NOTIFY_TO   — recipient (e.g. halickiec@gmail.com)
  FROM_EMAIL  — verified SES identity (domain or address)
"""

import json
import logging
import os
from typing import Any, Dict

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ses = boto3.client("ses")


def _parse_event(event: Dict[str, Any]) -> Dict[str, Any]:
    if not event:
        return {}
    body = event.get("body")
    if isinstance(body, str) and body.strip():
        try:
            parsed = json.loads(body)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass
    return event if isinstance(event, dict) else {}


def handler(event, context):
    data = _parse_event(event)
    full_name = (data.get("fullName") or data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip()

    notify_to = os.environ.get("NOTIFY_TO", "").strip()
    from_email = os.environ.get("FROM_EMAIL", "").strip()

    if not notify_to or not from_email:
        logger.error("Missing NOTIFY_TO or FROM_EMAIL")
        return {"statusCode": 500, "body": json.dumps({"error": "Misconfigured"})}

    if not email:
        logger.error("Missing email in payload")
        return {"statusCode": 400, "body": json.dumps({"error": "email required"})}

    subject = f"RADvisor waitlist: {email}"
    text_body = (
        "Someone signed up for the RADvisor launch waitlist.\n\n"
        f"Full name: {full_name or '(not provided)'}\n"
        f"Email: {email}\n"
    )

    try:
        ses.send_email(
            Source=from_email,
            Destination={"ToAddresses": [notify_to]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Text": {"Data": text_body, "Charset": "UTF-8"}},
            },
        )
    except Exception:
        logger.exception("SES send_email failed")
        return {"statusCode": 500, "body": json.dumps({"error": "send failed"})}

    return {"statusCode": 200, "body": json.dumps({"ok": True})}
