"""
Per–gear-item hero images keyed by (business_slug, gear name).

URLs were resolved by matching each listing’s brand + model (or closest product
class) to Wikimedia Commons / Wikipedia thumbnails and, where no suitable
Commons photo exists, to Unsplash editorial photos of the same equipment type.

Wikimedia thumbnails are CC-licensed on Commons; Unsplash images use their
license (https://unsplash.com/license). Re-run Wikipedia/Unsplash if a link
404s.
"""

from __future__ import annotations

# --- Wikimedia Commons (equipment / product-class photos) ---
WM_SLALOM_SKI = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Tonje_Sekse_Norway_2011_Slalom.jpg/960px-Tonje_Sekse_Norway_2011_Slalom.jpg"
WM_XC_SKI = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Trip_to_Skorafjell_1.jpg/960px-Trip_to_Skorafjell_1.jpg"
WM_SALOMON_XC = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Salomon_cross_country_skies_SLab_Skate.jpg/960px-Salomon_cross_country_skies_SLab_Skate.jpg"
WM_SNOWBOARD = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Snowboard_pow.jpg/960px-Snowboard_pow.jpg"
WM_SNOWSHOE = "https://upload.wikimedia.org/wikipedia/commons/4/47/Atlas_snowshoes.jpg"
WM_SKI_BINDINGS = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Alpine_ski_bindings_01.jpg/960px-Alpine_ski_bindings_01.jpg"
WM_SKI_POLES = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Anna_Haag_2011-02-28.jpg/960px-Anna_Haag_2011-02-28.jpg"
WM_BIKE_HELMET = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Bicycle_Helmet_0085.jpg/960px-Bicycle_Helmet_0085.jpg"
WM_STUMPJUMPER = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/P1080421_resize.JPG/960px-P1080421_resize.JPG"
WM_MTB = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Orbea_Occam_2020.jpg/960px-Orbea_Occam_2020.jpg"
WM_DOWNHILL_MTB = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/MTB_downhill_18_Stevage.jpg/960px-MTB_downhill_18_Stevage.jpg"
WM_EBIKE = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Electric_Wheels_in_Fort_Lauderdale%2C_Florida.jpg/960px-Electric_Wheels_in_Fort_Lauderdale%2C_Florida.jpg"
WM_FATBIKE = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Fat_bike.jpg/960px-Fat_bike.jpg"
WM_SEA_KAYAK = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Sea_Kayak.JPG/960px-Sea_Kayak.JPG"
WM_KAYAK = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Mohammad_Abubakar_Durrani_with_Kayak_paddlers_Pakistan_in_snow_training_2012_%28Hanna_Lake%29.jpg/960px-Mohammad_Abubakar_Durrani_with_Kayak_paddlers_Pakistan_in_snow_training_2012_%28Hanna_Lake%29.jpg"
WM_INFLATABLE_BOAT = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Zodiac_on_the_beach.jpg/960px-Zodiac_on_the_beach.jpg"
WM_SUP = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/J%C3%A9r%C3%A9my-Massi%C3%A8re_stand-up-paddle_biscarrosse-2.JPG/960px-J%C3%A9r%C3%A9my-Massi%C3%A8re_stand-up-paddle_biscarrosse-2.JPG"
WM_CATAMARAN = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/St-Vaast_Catamaran_Wikimedia_Commons.jpg/960px-St-Vaast_Catamaran_Wikimedia_Commons.jpg"
WM_BACKCOUNTRY = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/BackcountryDownhill.JPG/960px-BackcountryDownhill.JPG"
WM_SKI_TOURING = "https://upload.wikimedia.org/wikipedia/commons/4/4b/Wdomenada2003b.jpg"
WM_LOCKER = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Keyless_locker_001.JPG/960px-Keyless_locker_001.JPG"
WM_E_TRIKE = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/TRIPL.jpg/960px-TRIPL.jpg"
WM_PEDALO = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Waterbike_on_Lake_St._Clair_%281963%29.jpg/960px-Waterbike_on_Lake_St._Clair_%281963%29.jpg"
WM_DRYBAG = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Drybag.png/960px-Drybag.png"
WM_TRAILER = "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/BAW-trailer-loaded.jpg/960px-BAW-trailer-loaded.jpg"
# --- Unsplash (type-matched stock when Commons has no product shot) ---
US_SKI_ALPINE = "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=900&h=900&fit=crop&q=82"
US_SKI_DEMO = "https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=900&h=900&fit=crop&q=82"
US_SKI_JUNIOR = "https://images.unsplash.com/photo-1565992441121-4367c2967103?w=900&h=900&fit=crop&q=82"
US_BOOT = "https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=900&h=900&fit=crop&q=82"
US_SNOWBOARD = "https://images.unsplash.com/photo-1478700485868-8607ea01caf5?w=900&h=900&fit=crop&q=82"
US_MTB = "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=900&h=900&fit=crop&q=82"
US_MTB_TRAIL = "https://images.unsplash.com/photo-1576858574144-9ae1ebcf5ae5?w=900&h=900&fit=crop&q=82"
US_EMTB = "https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=900&h=900&fit=crop&q=82"
US_CRUISER = "https://images.unsplash.com/photo-1485965120184-e224f7a166fb?w=900&h=900&fit=crop&q=82"
US_KIDS_BIKE = "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=900&h=900&fit=crop&q=82"
US_KAYAK = "https://images.unsplash.com/photo-1604537466158-719b1972feb8?w=900&h=900&fit=crop&q=82"
US_SUP = "https://images.unsplash.com/photo-1526188717906-ab4a2f949f51?w=900&h=900&fit=crop&q=82"
US_SUP_GROUP = "https://images.unsplash.com/photo-1531722569936-825d3dd91b15?w=900&h=900&fit=crop&q=82"
US_CLEAR_KAYAK = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&h=900&fit=crop&q=82"
US_FLOAT = "https://images.unsplash.com/photo-1502680390367-361c6d9f38f4?w=900&h=900&fit=crop&q=82"
US_SPEAKER = "https://images.unsplash.com/photo-1608043152269-423dbba4e7e2?w=900&h=900&fit=crop&q=82"
US_TOY_CAR = "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&h=900&fit=crop&q=82"
US_SALOMON_BOOT = "https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=900&h=900&fit=crop&q=82"

# (business_slug, exact gear "name" from data.py) -> image URL
_GEAR_IMAGE_URLS: dict[tuple[str, str], str] = {
    # Village Ski Loft
    ("village-ski-loft", "Adult Performance Ski Package"): US_SKI_ALPINE,
    ("village-ski-loft", "Adult Demo Skis (All-Mountain)"): US_SKI_DEMO,
    ("village-ski-loft", "Junior Ski Package"): US_SKI_JUNIOR,
    ("village-ski-loft", "Cross Country Ski Package"): WM_SALOMON_XC,
    ("village-ski-loft", "Adult Performance Snowboard Package"): WM_SNOWBOARD,
    ("village-ski-loft", "Adult Demo Snowboard Package"): US_SNOWBOARD,
    ("village-ski-loft", "Junior Snowboard Package"): US_SNOWBOARD,
    ("village-ski-loft", "Snowshoes"): WM_SNOWSHOE,
    ("village-ski-loft", "Adult Skis or Snowboard (no boots)"): WM_SLALOM_SKI,
    ("village-ski-loft", "Adult Demo Skis or Snowboard (no boots)"): US_SKI_DEMO,
    ("village-ski-loft", "Junior Skis or Snowboard (no boots)"): US_SKI_JUNIOR,
    ("village-ski-loft", "Adult Ski or Snowboard Boots"): US_BOOT,
    ("village-ski-loft", "Junior Ski or Snowboard Boots"): US_BOOT,
    ("village-ski-loft", "Bindings"): WM_SKI_BINDINGS,
    ("village-ski-loft", "Helmet"): WM_BIKE_HELMET,
    ("village-ski-loft", "Poles"): WM_SKI_POLES,
    ("village-ski-loft", "E-Mountain Bike"): US_EMTB,
    ("village-ski-loft", "Premium Carbon Full-Suspension MTB"): WM_DOWNHILL_MTB,
    ("village-ski-loft", "Premium Full-Suspension MTB (Alloy)"): WM_STUMPJUMPER,
    ("village-ski-loft", "Front-Suspension MTB (Hardtail)"): WM_MTB,
    ("village-ski-loft", "Electric Cruiser (Turbo Como 2.0)"): WM_EBIKE,
    ("village-ski-loft", "Cruiser Bike (Roll Sport Disc)"): US_CRUISER,
    ("village-ski-loft", "Kids' Bike"): US_KIDS_BIKE,
    # Diamond Peak
    ("diamond-peak", "Adult Ski Package (ages 13+)"): WM_SLALOM_SKI,
    ("diamond-peak", "Child Ski Package (ages 12 & under)"): US_SKI_JUNIOR,
    ("diamond-peak", "Adult Snowboard Package (ages 13+)"): WM_SNOWBOARD,
    ("diamond-peak", "Child Snowboard Package (ages 12 & under)"): WM_SNOWBOARD,
    ("diamond-peak", "Demo Ski/Snowboard Package"): US_SKI_DEMO,
    ("diamond-peak", "Demo Skis or Snowboard Only"): US_SKI_DEMO,
    ("diamond-peak", "Skis or Snowboard Only"): WM_SLALOM_SKI,
    ("diamond-peak", "Ski Boots Only"): US_SALOMON_BOOT,
    ("diamond-peak", "Snowboard Boots Only"): US_BOOT,
    ("diamond-peak", "Helmet Only"): WM_BIKE_HELMET,
    ("diamond-peak", "Smartecarte Day Locker"): WM_LOCKER,
    ("diamond-peak", "Overnight Locker"): WM_LOCKER,
    # Tahoe Multisport
    ("tahoe-multisport", "Single Kayak (Hardshell) — 1 Day"): WM_SEA_KAYAK,
    ("tahoe-multisport", "Double Kayak (Hardshell) — 1 Day"): WM_SEA_KAYAK,
    ("tahoe-multisport", "Single Inflatable Kayak — 1 Day"): WM_INFLATABLE_BOAT,
    ("tahoe-multisport", "Double Inflatable Kayak — 1 Day"): WM_INFLATABLE_BOAT,
    ("tahoe-multisport", "Inflatable Stand Up Paddleboard — 1 Day"): US_SUP,
    ("tahoe-multisport", "Single Hobie Mirage Drive Kayak (Beach)"): WM_CATAMARAN,
    ("tahoe-multisport", "Feel Free Single Kayak (Beach)"): WM_SEA_KAYAK,
    ("tahoe-multisport", "Feel Free Double Kayak (Beach)"): WM_SEA_KAYAK,
    ("tahoe-multisport", "Hobie Mirage Eclipse (Stand-Up Pedal)"): WM_SUP,
    ("tahoe-multisport", "Clear Kayak (Beach)"): US_CLEAR_KAYAK,
    ("tahoe-multisport", "Kids Kayak (Beach)"): US_KAYAK,
    ("tahoe-multisport", "Clear Paddle Board (Beach)"): WM_SUP,
    ("tahoe-multisport", "Electric Bike Rental"): WM_EBIKE,
    ("tahoe-multisport", "Rad Runner 3+ Electric Trike"): WM_E_TRIKE,
    ("tahoe-multisport", "Clear Kayak Tour at Sand Harbor (daily)"): US_CLEAR_KAYAK,
    ("tahoe-multisport", "Cross-Country Ski Package"): WM_XC_SKI,
    ("tahoe-multisport", "Backcountry AT Ski Demo"): WM_BACKCOUNTRY,
    # Flume Trail Bikes
    ("flume-trail-bikes", "Specialized Fuse Comp (Hardtail)"): WM_MTB,
    ("flume-trail-bikes", "Ibis Ripley SL (Carbon, 2026)"): WM_DOWNHILL_MTB,
    ("flume-trail-bikes", "Ibis Ripley V5 Carbon"): WM_STUMPJUMPER,
    ("flume-trail-bikes", "Specialized Stumpjumper Alloy Comp 29er"): WM_STUMPJUMPER,
    ("flume-trail-bikes", "Specialized Stumpjumper FSR Comp Carbon 29er"): WM_STUMPJUMPER,
    ("flume-trail-bikes", "Ibis OSO Full-Suspension E-MTB"): US_EMTB,
    ("flume-trail-bikes", "Specialized Turbo Levo Full Suspension"): WM_EBIKE,
    ("flume-trail-bikes", 'Specialized Turbo Levo SL Kids 24"'): US_KIDS_BIKE,
    ("flume-trail-bikes", 'Husqvarna Lite Cross Jr. 24" Pedal Assist'): US_KIDS_BIKE,
    # All Around Tahoe
    ("all-around-tahoe", "6-Person Paddleboard (15 ft)"): US_SUP_GROUP,
    ("all-around-tahoe", "Tandem Paddleboard"): US_SUP,
    ("all-around-tahoe", "Single Paddleboard"): US_SUP,
    ("all-around-tahoe", "Kayak (Inflatable)"): WM_INFLATABLE_BOAT,
    ("all-around-tahoe", "Swan Boat (6–7 person)"): WM_PEDALO,
    ("all-around-tahoe", "Trek Mountain Bike (Standard)"): US_MTB,
    ("all-around-tahoe", "Flume Trail Mountain Bike"): US_MTB_TRAIL,
    ("all-around-tahoe", "Mountain Bike with Sand Tires"): WM_FATBIKE,
    ("all-around-tahoe", "6-Person Blue Floaty"): US_FLOAT,
    ("all-around-tahoe", "Waterproof Bluetooth Speaker"): US_SPEAKER,
    ("all-around-tahoe", "Beach Wagon"): WM_TRAILER,
    ("all-around-tahoe", "4WD Electric Toy Bronco"): US_TOY_CAR,
    ("all-around-tahoe", "Dry Bag"): WM_DRYBAG,
}


def attach_gear_images(businesses: list[dict]) -> None:
    """Mutate each gear dict in place with ``image_url``."""
    for biz in businesses:
        slug = biz["slug"]
        for item in biz["gear"]:
            key = (slug, item["name"])
            url = _GEAR_IMAGE_URLS.get(key, "")
            if not url:
                raise KeyError(f"Missing image URL for gear: {key!r}")
            item["image_url"] = url


def gear_image_url(slug: str, name: str) -> str:
    return _GEAR_IMAGE_URLS.get((slug, name), "")
