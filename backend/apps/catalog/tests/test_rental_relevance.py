from django.test import SimpleTestCase

from apps.catalog.business_filters import evaluate_business, is_relevant, rejection_reason
from apps.catalog.geo import search_viewport_payload, within_service_area, within_service_region
from apps.catalog.rental_taxonomy import classify


class RelevanceTests(SimpleTestCase):
    def test_accepts_rental_by_name(self):
        self.assertTrue(is_relevant("Tahoe Ski Rental"))
        self.assertTrue(is_relevant("Kayak Shack Rentals"))

    def test_accepts_marina_keyword(self):
        self.assertTrue(is_relevant("Zephyr Cove Marina"))

    def test_rejects_hotel_and_storage(self):
        self.assertFalse(is_relevant("Hilton Garden Inn"))
        self.assertFalse(is_relevant("Meadowood Storage"))

    def test_rejects_retail_bike_shop(self):
        self.assertFalse(is_relevant("Joe's Bike Shop"))

    def test_rejects_stopped_gear_rental_operator(self):
        reason, slugs = evaluate_business(
            name="Action Water Sports of Incline Village",
            website="",
            state="CA",
            city="Incline Village",
            lat=39.2510,
            lng=-119.9530,
            types=["marina", "sporting_goods_store"],
            query="kayak rental",
            source_slug="kayak",
        )
        self.assertEqual(reason, "excluded:stopped_gear_rental")
        self.assertEqual(slugs, set())

    def test_accepts_scheels(self):
        reason, slugs = evaluate_business(
            name="Scheels",
            website="",
            state="NV",
            lat=39.5260,
            lng=-119.8100,
            types=["sporting_goods_store"],
            query="ski rental",
            source_slug="ski",
        )
        self.assertIsNone(reason)
        self.assertIn("ski", slugs)

    def test_rejects_bass_pro_shops(self):
        reason, slugs = evaluate_business(
            name="Bass Pro Shops",
            website="https://www.basspro.com",
            state="NV",
            lat=39.5260,
            lng=-119.8100,
            types=["sporting_goods_store"],
            query="outdoor gear rental",
            source_slug="air",
        )
        self.assertEqual(reason, "excluded:retail_chain")
        self.assertEqual(slugs, set())

    def test_classify_tags_from_curated_query(self):
        slugs = classify("Tahoe Dave's", query="ski rental", source_slug="ski")
        self.assertIn("ski", slugs)

    def test_classify_tags_when_name_matches(self):
        slugs = classify("Tahoe Boat Rentals", query="boat rental", source_slug="boat")
        self.assertIn("boat", slugs)

    def test_classify_ski_shop_not_tagged_from_other_queries(self):
        """Name keywords win over incidental Places hits (Moment Skis case)."""
        name = "Moment Skis"
        for query, source_slug in (
            ("rock climbing gear rental", "climbing"),
            ("snowboard rental", "snowboard"),
            ("nordic ski rental", "nordic"),
        ):
            slugs = classify(name, query=query, source_slug=source_slug)
            self.assertEqual(slugs, {"ski"}, msg=f"query={query!r}")

    def test_accepts_brand_name_from_rental_query(self):
        reason, slugs = evaluate_business(
            name="Tahoe Dave's",
            website="",
            state="CA",
            lat=39.3280,
            lng=-120.1833,
            query="ski rental",
            source_slug="ski",
        )
        self.assertIsNone(reason)
        self.assertIn("ski", slugs)

    def test_accepts_resort_with_gear_rental_name(self):
        """Camp Richardson sits on a resort property but rents outdoor gear."""
        self.assertTrue(
            is_relevant("Camp Richardson Mountain Sports Center")
        )
        reason, slugs = evaluate_business(
            name="Camp Richardson Resort Mountain Sports Center",
            website="",
            state="CA",
            city="South Lake Tahoe",
            lat=38.9389,
            lng=-119.9770,
            types=["lodging", "sporting_goods_store"],
            query="ski rental",
            source_slug="ski",
        )
        self.assertIsNone(reason)
        self.assertIn("ski", slugs)

    def test_still_rejects_lodging_only_resort(self):
        self.assertFalse(is_relevant("Emerald Bay Resort & Spa"))

    def test_accepts_marina_with_cafe_in_name(self):
        """Fallen Leaf Lake rents kayaks; Google name includes Cafe and Marina."""
        self.assertTrue(is_relevant("Fallen Leaf Lake Store, Cafe and Marina"))
        reason, slugs = evaluate_business(
            name="Fallen Leaf Lake Store, Cafe and Marina",
            website="",
            state="CA",
            city="South Lake Tahoe",
            lat=38.9050,
            lng=-120.0850,
            types=["cafe", "marina", "store"],
            query="kayak rental",
            source_slug="kayak",
        )
        self.assertIsNone(reason)
        self.assertIn("kayak", slugs)

    def test_still_rejects_cafe_only(self):
        self.assertFalse(is_relevant("Sierra Mountain Cafe"))

    def test_accepts_water_ski_school(self):
        """Ski/wakeboard schools often rent gear despite 'school' in the name."""
        self.assertTrue(is_relevant("High Sierra Water Ski School"))
        reason, slugs = evaluate_business(
            name="High Sierra Water Ski School",
            website="",
            state="CA",
            city="South Lake Tahoe",
            lat=38.9480,
            lng=-119.9770,
            types=["school", "sporting_goods_store"],
            query="boat rental",
            source_slug="boat",
        )
        self.assertIsNone(reason)
        self.assertIn("boat", slugs)

    def test_still_rejects_school_only(self):
        self.assertFalse(is_relevant("Reno Driving School"))

    def test_rejects_bike_park(self):
        reason, slugs = evaluate_business(
            name="Auburn Bike Park",
            website="",
            state="CA",
            city="Auburn",
            lat=38.8966,
            lng=-121.0769,
            query="mountain bike rental",
            source_slug="mountain-bike",
        )
        self.assertEqual(reason, "excluded:bike_park")
        self.assertEqual(slugs, set())

    def test_accepts_truckee_bike_park(self):
        """Truckee Bike Park rents bikes — unlike municipal parks-only sites."""
        reason, slugs = evaluate_business(
            name="Truckee Bike Park",
            website="",
            state="CA",
            city="Truckee",
            lat=39.3280,
            lng=-120.1833,
            query="mountain bike rental",
            source_slug="mountain-bike",
        )
        self.assertIsNone(reason)
        self.assertIn("mountain-bike", slugs)

    def test_rejects_home_medical_mobility(self):
        reason, slugs = evaluate_business(
            name="Accellence Home Medical",
            website="",
            state="NV",
            lat=39.5296,
            lng=-119.8138,
            query="e-scooter rental",
            source_slug="e-scooter",
        )
        self.assertEqual(reason, "excluded:home medical")
        self.assertEqual(slugs, set())

    def test_rejects_rv_rental(self):
        reason, slugs = evaluate_business(
            name="Western Skies RV",
            website="",
            state="CA",
            lat=39.3280,
            lng=-120.1833,
            query="camping gear rental",
            source_slug="camping",
        )
        self.assertEqual(reason, "deferred:rv")
        self.assertEqual(slugs, set())

    def test_rejects_vacation_rental_listing(self):
        """Airbnb-style titles mention ski resorts but are not gear shops."""
        name = "4 Mi to Downhill Ski Resort! Spacious Family Haven"
        self.assertFalse(is_relevant(name))
        reason, slugs = evaluate_business(
            name=name,
            website="",
            state="CA",
            lat=39.3280,
            lng=-120.1833,
            query="ski rental",
            source_slug="ski",
        )
        self.assertEqual(reason, "excluded:vacation_rental")
        self.assertEqual(slugs, set())

    def test_still_rejects_hotel_from_rental_query(self):
        reason, _slugs = evaluate_business(
            name="Hilton Garden Inn",
            website="",
            state="CA",
            lat=39.3280,
            lng=-120.1833,
            query="boat rental",
            source_slug="boat",
        )
        self.assertTrue(reason and reason.startswith("excluded:"))


class GeoTests(SimpleTestCase):
    def test_search_viewport_payload_sw_ne(self):
        rect = search_viewport_payload()["rectangle"]
        self.assertLess(rect["low"]["latitude"], rect["high"]["latitude"])
        self.assertLess(rect["low"]["longitude"], rect["high"]["longitude"])

    def test_in_region_cities(self):
        cities = {
            "Truckee": (39.3280, -120.1833),
            "South Lake Tahoe": (38.9399, -119.9772),
            "Grass Valley": (39.2191, -121.0610),
            "Nevada City": (39.2616, -121.0160),
            "Auburn": (38.8966, -121.0769),
            "Placerville": (38.7296, -120.7986),
        }
        for _name, (lat, lng) in cities.items():
            self.assertTrue(within_service_region(lat, lng))

    def test_out_of_region(self):
        self.assertFalse(within_service_region(38.5816, -121.4944))  # Sacramento
        self.assertFalse(within_service_region(40.7608, -111.8910))  # Salt Lake City
        self.assertFalse(within_service_region(None, None))

    def test_groveland_all_outdoors_accepted(self):
        reason, slugs = evaluate_business(
            name="All-Outdoors California Whitewater Rafting",
            website="",
            state="CA",
            city="Groveland",
            address="24000 Casa Loma Rd, Groveland, CA 95321, USA",
            lat=37.817496,
            lng=-120.109784,
        )
        self.assertIsNone(reason)
        self.assertIn("raft", slugs)

    def test_lotus_accepted_when_coords_at_hq(self):
        """Google may geocode to Walnut Creek HQ while city is Lotus."""
        self.assertFalse(within_service_region(37.9101, -122.0652))
        self.assertTrue(
            within_service_area(
                37.9101,
                -122.0652,
                city="Lotus",
                county="El Dorado County",
                state="CA",
            )
        )
        reason, slugs = evaluate_business(
            name="All-Outdoors California Whitewater Rafting",
            website="",
            state="CA",
            city="Lotus",
            county="El Dorado County",
            lat=37.9101,
            lng=-122.0652,
            query="raft rental",
            source_slug="raft",
        )
        self.assertIsNone(reason)
        self.assertIn("raft", slugs)

    def test_sacramento_rejected_by_evaluate(self):
        reason, slugs = evaluate_business(
            name="River City Kayak Rental",
            website="",
            state="CA",
            city="Sacramento",
            lat=38.5816,
            lng=-121.4944,
            query="kayak rental",
            source_slug="kayak",
        )
        self.assertEqual(reason, "out_of_region")
        self.assertEqual(slugs, set())
