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

    def test_classify_tags_from_curated_query(self):
        slugs = classify("Tahoe Dave's", query="ski rental", source_slug="ski")
        self.assertIn("ski", slugs)

    def test_classify_tags_when_name_matches(self):
        slugs = classify("Tahoe Boat Rentals", query="boat rental", source_slug="boat")
        self.assertIn("boat", slugs)

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
