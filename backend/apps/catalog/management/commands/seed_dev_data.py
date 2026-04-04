from datetime import date, timedelta, time
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import Profile
from apps.catalog.models import Category, GearItem, Wishlist, WishlistItem
from apps.bookings.models import Booking
from apps.messaging.models import MessageThread, Message
from apps.reviews.models import Review
from apps.guiding.models import GuideProfile, GuideService, GuideAvailability, GuideBooking
from apps.community.models import CommunityPost, CommunityComment

User = get_user_model()


class Command(BaseCommand):
    help = "Seed the database with development data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding development data...")

        users = {}
        user_data = [
            ("alice@example.com", "alice", "Alice Johnson", "Boulder", "CO"),
            ("bob@example.com", "bob", "Bob Martinez", "Denver", "CO"),
            ("cara@example.com", "cara", "Cara Chen", "Portland", "OR"),
            ("dan@example.com", "dan", "Dan Thompson", "Salt Lake City", "UT"),
            ("emma@example.com", "emma", "Emma Wilson", "Bend", "OR"),
        ]
        for email, username, display_name, city, state in user_data:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"username": username},
            )
            if created:
                user.set_password("testpass123")
                user.save()
            profile, _ = Profile.objects.get_or_create(
                user=user,
                defaults={"display_name": display_name, "city": city, "state": state},
            )
            if profile.display_name != display_name:
                profile.display_name = display_name
                profile.city = city
                profile.state = state
                profile.save()
            users[username] = user

        categories_data = [
            # Camp
            ("backpacks", "Backpacks", "Camp"),
            ("tents", "Tents", "Camp"),
            ("sleeping-bags", "Sleeping Bags", "Camp"),
            ("sleeping-pads", "Sleeping Pads", "Camp"),
            ("stoves", "Stoves", "Camp"),
            ("water-purification", "Water Purification", "Camp"),
            # Rock (climbing)
            ("climbing", "Climbing", "Rock"),
            # Dirt (wheels & motors)
            ("motorsports", "Motorsports", "Dirt"),
            ("mtb", "MTB", "Dirt"),
            # Snow
            ("ice-climbing", "Ice Climbing", "Snow"),
            ("skiing", "Skiing", "Snow"),
            ("snowboarding", "Snowboarding", "Snow"),
            # Travel
            ("campers", "Campers", "Travel"),
            ("vans", "Vans", "Travel"),
            ("vehicle-accessories", "Vehicle Accessories", "Travel"),
            # Water
            ("boats", "Boats", "Water"),
            ("fishing", "Fishing", "Water"),
            ("foils", "Foils", "Water"),
            ("jetskis", "Jetskis", "Water"),
            ("kayaks", "Kayaks", "Water"),
            ("paddleboards", "Paddleboards", "Water"),
        ]
        cats = {}
        for slug, name, group in categories_data:
            cat, _ = Category.objects.get_or_create(
                slug=slug,
                defaults={"name": name, "group": group, "icon": ""},
            )
            if cat.group != group:
                cat.group = group
                cat.save()
            cats[slug] = cat

        # (owner, title, category_slug, brand, condition, daily_rate, deposit, city, state, image_url)
        gear_data = [
            # ── Camp > Backpacks ──
            ("alice", "Osprey Atmos AG 65L", "backpacks", "Osprey", "like_new", 25, 40, "Boulder", "CO",
             "https://images.unsplash.com/photo-1622260614153-03223fb72052?w=600&h=600&fit=crop"),
            ("bob", "Gregory Baltoro 75L", "backpacks", "Gregory", "good", 22, 35, "Denver", "CO",
             "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop"),
            ("dan", "Deuter Aircontact 55+10", "backpacks", "Deuter", "like_new", 20, 30, "Salt Lake City", "UT",
             "https://images.unsplash.com/photo-1585916420730-d7f95e942d43?w=600&h=600&fit=crop"),
            # ── Camp > Tents ──
            ("alice", "REI Half Dome 2-Person Tent", "tents", "REI", "like_new", 35, 50, "Boulder", "CO",
             "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=600&fit=crop"),
            ("cara", "Big Agnes Copper Spur HV UL2", "tents", "Big Agnes", "new", 40, 60, "Portland", "OR",
             "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=600&h=600&fit=crop"),
            ("emma", "MSR Hubba Hubba NX 2P", "tents", "MSR", "good", 32, 50, "Bend", "OR",
             "https://images.unsplash.com/photo-1563299796-17596ed6b017?w=600&h=600&fit=crop"),
            # ── Camp > Sleeping Bags ──
            ("alice", "North Face Cat's Meow 20°F", "sleeping-bags", "The North Face", "good", 18, 30, "Boulder", "CO",
             "https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?w=600&h=600&fit=crop"),
            ("dan", "Marmot Trestles Elite 15°F", "sleeping-bags", "Marmot", "like_new", 20, 35, "Salt Lake City", "UT",
             "https://images.unsplash.com/photo-1529408570949-78e6de10e945?w=600&h=600&fit=crop"),
            # ── Camp > Sleeping Pads ──
            ("bob", "Therm-a-Rest NeoAir XTherm", "sleeping-pads", "Therm-a-Rest", "like_new", 12, 20, "Denver", "CO",
             "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=600&h=600&fit=crop"),
            ("emma", "NEMO Tensor Ultralight Pad", "sleeping-pads", "NEMO", "new", 10, 15, "Bend", "OR",
             "https://images.unsplash.com/photo-1525811902-f2342640856e?w=600&h=600&fit=crop"),
            # ── Camp > Stoves ──
            ("dan", "MSR PocketRocket Deluxe", "stoves", "MSR", "good", 8, 15, "Salt Lake City", "UT",
             "https://images.unsplash.com/photo-1571687949921-1306bfb24b1e?w=600&h=600&fit=crop"),
            ("alice", "Jetboil Flash Cooking System", "stoves", "Jetboil", "like_new", 10, 20, "Boulder", "CO",
             "https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?w=600&h=600&fit=crop"),
            # ── Camp > Water Purification ──
            ("cara", "Katadyn BeFree 1L Filter", "water-purification", "Katadyn", "new", 5, 10, "Portland", "OR",
             "https://images.unsplash.com/photo-1495774539583-885e02cca8c2?w=600&h=600&fit=crop"),
            ("bob", "MSR Guardian Gravity Purifier", "water-purification", "MSR", "good", 8, 15, "Denver", "CO",
             "https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=600&h=600&fit=crop"),
            # ── Rock > Climbing ──
            ("alice", "Black Diamond Momentum Harness", "climbing", "Black Diamond", "like_new", 12, 25, "Boulder", "CO",
             "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&h=600&fit=crop"),
            ("dan", "La Sportiva Solution Comp Shoes", "climbing", "La Sportiva", "good", 10, 20, "Salt Lake City", "UT",
             "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=600&h=600&fit=crop"),
            ("alice", "Metolius Session II Crash Pad", "climbing", "Metolius", "good", 15, 30, "Boulder", "CO",
             "https://images.unsplash.com/photo-1601024445121-e5b82f020549?w=600&h=600&fit=crop"),
            # ── Dirt > Motorsports ──
            ("bob", "Honda CRF250 Dirt Bike", "motorsports", "Honda", "good", 120, 500, "Denver", "CO",
             "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&h=600&fit=crop"),
            ("emma", "Kawasaki KLX300 Dual Sport", "motorsports", "Kawasaki", "like_new", 95, 400, "Bend", "OR",
             "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=600&fit=crop"),
            # ── Dirt > MTB ──
            ("emma", "Trek Fuel EX 7 Mountain Bike", "mtb", "Trek", "good", 60, 150, "Bend", "OR",
             "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=600&h=600&fit=crop"),
            ("bob", "Santa Cruz Hightower C S", "mtb", "Santa Cruz", "like_new", 75, 200, "Denver", "CO",
             "https://images.unsplash.com/photo-1576858574144-9ae1ebcf5ae5?w=600&h=600&fit=crop"),
            ("cara", "Specialized Stumpjumper Comp", "mtb", "Specialized", "good", 65, 175, "Portland", "OR",
             "https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=600&h=600&fit=crop"),
            # ── Snow > Ice Climbing ──
            ("dan", "Petzl Nomic Ice Axes (pair)", "ice-climbing", "Petzl", "good", 30, 80, "Salt Lake City", "UT",
             "https://images.unsplash.com/photo-1522056615691-da7b8106c665?w=600&h=600&fit=crop"),
            ("alice", "Black Diamond Sabretooth Crampons", "ice-climbing", "Black Diamond", "like_new", 18, 40, "Boulder", "CO",
             "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&h=600&fit=crop"),
            # ── Snow > Skiing ──
            ("bob", "Salomon QST 106 All-Mountain Skis", "skiing", "Salomon", "good", 45, 100, "Denver", "CO",
             "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=600&h=600&fit=crop"),
            ("dan", "Nordica Enforcer 100 Skis", "skiing", "Nordica", "like_new", 50, 120, "Salt Lake City", "UT",
             "https://images.unsplash.com/photo-1565992441121-4367c2967103?w=600&h=600&fit=crop"),
            ("alice", "Dynafit Hoji Free 130 Boots", "skiing", "Dynafit", "good", 35, 80, "Boulder", "CO",
             "https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=600&h=600&fit=crop"),
            # ── Snow > Snowboarding ──
            ("bob", "Burton Custom 158 Snowboard", "snowboarding", "Burton", "like_new", 40, 80, "Denver", "CO",
             "https://images.unsplash.com/photo-1478700485868-8607ea01caf5?w=600&h=600&fit=crop"),
            ("emma", "Jones Flagship 162W Splitboard", "snowboarding", "Jones", "good", 50, 120, "Bend", "OR",
             "https://images.unsplash.com/photo-1457459686225-c7db79d4e59f?w=600&h=600&fit=crop"),
            # ── Travel > Campers ──
            ("cara", "Jayco Jay Feather X17Z Trailer", "campers", "Jayco", "good", 110, 500, "Portland", "OR",
             "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=600&h=600&fit=crop"),
            ("bob", "Airstream Basecamp 20X", "campers", "Airstream", "like_new", 175, 800, "Denver", "CO",
             "https://images.unsplash.com/photo-1572204097183-e1ab140342ed?w=600&h=600&fit=crop"),
            # ── Travel > Vans ──
            ("emma", "Ford Transit Camper Van", "vans", "Ford", "good", 145, 600, "Bend", "OR",
             "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&h=600&fit=crop"),
            ("alice", "Mercedes Sprinter Adventure Van", "vans", "Mercedes", "like_new", 195, 800, "Boulder", "CO",
             "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=600&fit=crop"),
            # ── Travel > Vehicle Accessories ──
            ("dan", "Thule Force XT XL Roof Box", "vehicle-accessories", "Thule", "like_new", 18, 40, "Salt Lake City", "UT",
             "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&h=600&fit=crop"),
            ("bob", "Yakima HighRoad Bike Rack", "vehicle-accessories", "Yakima", "good", 12, 25, "Denver", "CO",
             "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=600&fit=crop"),
            # ── Water > Boats ──
            ("cara", "Sea Eagle 370 Inflatable Boat", "boats", "Sea Eagle", "good", 65, 150, "Portland", "OR",
             "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=600&fit=crop"),
            ("emma", "Zodiac Cadet 310 Aero", "boats", "Zodiac", "like_new", 85, 200, "Bend", "OR",
             "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=600&h=600&fit=crop"),
            # ── Water > Fishing ──
            ("dan", "Orvis Clearwater 9' 5wt Fly Rod", "fishing", "Orvis", "like_new", 15, 30, "Salt Lake City", "UT",
             "https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=600&h=600&fit=crop"),
            ("alice", "Simms G3 Guide Waders", "fishing", "Simms", "good", 25, 50, "Boulder", "CO",
             "https://images.unsplash.com/photo-1532015917281-ae078d5169c0?w=600&h=600&fit=crop"),
            # ── Water > Foils ──
            ("emma", "Lift eFoil 5'2\" Board", "foils", "Lift", "like_new", 150, 500, "Bend", "OR",
             "https://images.unsplash.com/photo-1502680390548-bdbac40a4e2a?w=600&h=600&fit=crop"),
            ("bob", "Slingshot Hover Glide Wake Foil", "foils", "Slingshot", "good", 75, 200, "Denver", "CO",
             "https://images.unsplash.com/photo-1509130298739-651801c76e96?w=600&h=600&fit=crop"),
            # ── Water > Jetskis ──
            ("cara", "Yamaha EX Sport WaveRunner", "jetskis", "Yamaha", "good", 200, 800, "Portland", "OR",
             "https://images.unsplash.com/photo-1614788744351-e4e8ae491d44?w=600&h=600&fit=crop"),
            ("bob", "Sea-Doo Spark Trixx 2-Up", "jetskis", "Sea-Doo", "like_new", 185, 700, "Denver", "CO",
             "https://images.unsplash.com/photo-1565361849078-294849288fae?w=600&h=600&fit=crop"),
            # ── Water > Kayaks ──
            ("cara", "Perception Pescador Pro 12", "kayaks", "Perception", "good", 45, 60, "Portland", "OR",
             "https://images.unsplash.com/photo-1604537466158-719b1972feb8?w=600&h=600&fit=crop"),
            ("dan", "Wilderness Systems Tarpon 120", "kayaks", "Wilderness Systems", "like_new", 50, 75, "Salt Lake City", "UT",
             "https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=600&h=600&fit=crop"),
            ("emma", "Dagger Stratos 14.5 Sea Kayak", "kayaks", "Dagger", "good", 55, 80, "Bend", "OR",
             "https://images.unsplash.com/photo-1497106636505-e4d062d25759?w=600&h=600&fit=crop"),
            # ── Water > Paddleboards ──
            ("cara", "BOTE Breeze Aero 11'6\" iSUP", "paddleboards", "BOTE", "like_new", 40, 60, "Portland", "OR",
             "https://images.unsplash.com/photo-1526188717906-ab4a2f949f51?w=600&h=600&fit=crop"),
            ("alice", "Red Paddle Co Ride 10'6\"", "paddleboards", "Red Paddle Co", "new", 45, 70, "Boulder", "CO",
             "https://images.unsplash.com/photo-1531722569936-825d3dd91b15?w=600&h=600&fit=crop"),
            ("emma", "Isle Pioneer Inflatable SUP", "paddleboards", "Isle", "good", 30, 50, "Bend", "OR",
             "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=600&h=600&fit=crop"),
        ]
        items = []
        user_keys = list(users.keys())
        for owner_key, title, cat_slug, brand, condition, rate, deposit, city, state, img in gear_data:
            item, _ = GearItem.objects.get_or_create(
                title=title,
                owner=users[owner_key],
                defaults={
                    "description": f"Premium {cats[cat_slug].name.lower()} gear for rent. {brand} quality, {condition.replace('_', ' ')} condition. Pick up locally in {city}, {state}.",
                    "category": cats[cat_slug],
                    "brand": brand,
                    "condition": condition,
                    "daily_rate": Decimal(str(rate)),
                    "deposit_amount": Decimal(str(deposit)),
                    "city": city,
                    "state": state,
                    "image_url": img,
                },
            )
            items.append(item)

        today = date.today()
        booking_data = [
            (items[0], users["bob"], "approved", today + timedelta(days=5), today + timedelta(days=8)),
            (items[2], users["alice"], "pending", today + timedelta(days=10), today + timedelta(days=14)),
            (items[4], users["dan"], "completed", today - timedelta(days=10), today - timedelta(days=7)),
            (items[6], users["cara"], "active", today - timedelta(days=1), today + timedelta(days=3)),
            (items[8], users["bob"], "declined", today + timedelta(days=2), today + timedelta(days=4)),
        ]
        bookings = []
        for gear, renter, bstatus, start, end in booking_data:
            days = (end - start).days
            bk, _ = Booking.objects.get_or_create(
                gear_item=gear,
                renter=renter,
                start_date=start,
                defaults={
                    "owner": gear.owner,
                    "end_date": end,
                    "status": bstatus,
                    "daily_rate_at_booking": gear.daily_rate,
                    "deposit_amount_at_booking": gear.deposit_amount,
                    "subtotal": gear.daily_rate * days,
                    "total_price": gear.daily_rate * days + gear.deposit_amount,
                },
            )
            bookings.append(bk)

        completed_bookings = [b for b in bookings if b.status == "completed"]
        for bk in completed_bookings:
            Review.objects.get_or_create(
                booking=bk,
                reviewer=bk.renter,
                defaults={
                    "reviewee": bk.owner,
                    "rating": 5,
                    "comment": "Great gear, well maintained! Would rent again.",
                },
            )
            Review.objects.get_or_create(
                booking=bk,
                reviewer=bk.owner,
                defaults={
                    "reviewee": bk.renter,
                    "rating": 4,
                    "comment": "Respectful renter, returned everything in great condition.",
                },
            )

        guide_data = [
            (users["alice"], "Certified Wilderness Guide", ["Backpacking", "Camping", "Rock Climbing"], 8, ["WFR", "Leave No Trace Trainer"], ["English", "Spanish"]),
            (users["dan"], "Backcountry Ski Guide", ["Backcountry Skiing", "Snowshoeing", "Mountaineering"], 12, ["AIARE Level 2", "WFR"], ["English"]),
            (users["emma"], "Mountain Bike & Surf Guide", ["Mountain Biking", "Surfing", "Trail Running"], 5, ["PMBI Certified"], ["English"]),
        ]
        for user, headline, specialties, years, certs, langs in guide_data:
            GuideProfile.objects.get_or_create(
                user=user,
                defaults={
                    "headline": headline,
                    "specialties": specialties,
                    "experience_years": years,
                    "certifications": certs,
                    "languages": langs,
                    "is_verified": True,
                },
            )

        service_data = [
            (users["alice"], "Flatirons Sunrise Hike",
             "Join me for an unforgettable sunrise hike in Boulder's iconic Flatirons.",
             cats.get("backpacks"), 4, 8, 65, "moderate",
             "Flatirons Trailhead", "Boulder", "CO",
             ["Expert guide", "Trail snacks", "Group photos"],
             ["Hiking boots", "Water bottle (1L)", "Headlamp"]),
            (users["alice"], "Indian Peaks Backpacking Weekend",
             "A two-day backcountry adventure through the stunning Indian Peaks Wilderness.",
             cats.get("backpacks"), 20, 6, 195, "hard",
             "Hessie Trailhead", "Nederland", "CO",
             ["Expert guide", "Route planning", "Camp setup help", "Emergency communication"],
             ["Backpack 50L+", "Sleeping bag", "Tent", "3-season clothing"]),
            (users["dan"], "Backcountry Powder Day",
             "Chase fresh powder in the Wasatch backcountry.",
             cats.get("skiing"), 6, 4, 150, "hard",
             "Big Cottonwood Canyon", "Salt Lake City", "UT",
             ["Avalanche safety gear", "Expert route finding", "Lunch"],
             ["AT/backcountry ski setup", "Avalanche beacon", "Fitness for 3000ft+ vert"]),
            (users["dan"], "Snowshoe & Hot Springs Tour",
             "A mellow snowshoe through pristine winter forest ending at natural hot springs.",
             cats.get("skiing"), 5, 10, 75, "easy",
             "Homestead Crater", "Midway", "UT",
             ["Snowshoe rental", "Hot springs entry", "Hot cocoa"],
             ["Warm layers", "Swimsuit", "Towel"]),
            (users["emma"], "Bend Mountain Bike Epic",
             "Ride the best singletrack Bend has to offer.",
             cats.get("mtb"), 5, 6, 85, "moderate",
             "Phil's Trailhead", "Bend", "OR",
             ["Trail guide", "Mechanical support", "Post-ride beer"],
             ["Mountain bike (or rent one)", "Helmet", "Water & snacks"]),
            (users["emma"], "Oregon Coast Surf Lesson",
             "Learn to surf on the beautiful Oregon coast. All levels welcome.",
             cats.get("paddleboards"), 3, 4, 95, "easy",
             "Short Sands Beach", "Manzanita", "OR",
             ["Wetsuit rental", "Surfboard", "Beach safety briefing"],
             ["Swimsuit", "Towel", "Sunscreen"]),
        ]
        services = []
        for guide, title, desc, activity, hours, max_p, price, diff, loc, city, state, includes, reqs in service_data:
            svc, _ = GuideService.objects.get_or_create(
                title=title,
                guide=guide,
                defaults={
                    "description": desc,
                    "activity_type": activity,
                    "duration_hours": hours,
                    "max_participants": max_p,
                    "price_per_person": Decimal(str(price)),
                    "difficulty_level": diff,
                    "location_name": loc,
                    "city": city,
                    "state": state,
                    "includes": includes,
                    "requirements": reqs,
                },
            )
            services.append(svc)

        for svc in services:
            for i in range(7, 28):
                d = today + timedelta(days=i)
                if d.weekday() < 5:
                    continue
                GuideAvailability.objects.get_or_create(
                    service=svc,
                    date=d,
                    defaults={
                        "start_time": time(8, 0),
                        "spots_remaining": svc.max_participants,
                    },
                )

        if services:
            GuideBooking.objects.get_or_create(
                service=services[0],
                guest=users["bob"],
                date=today + timedelta(days=14),
                defaults={
                    "guide": services[0].guide,
                    "participants": 2,
                    "price_per_person_at_booking": services[0].price_per_person,
                    "total_price": services[0].price_per_person * 2,
                    "status": "approved",
                },
            )
            GuideBooking.objects.get_or_create(
                service=services[3],
                guest=users["cara"],
                date=today + timedelta(days=21),
                defaults={
                    "guide": services[3].guide,
                    "participants": 3,
                    "price_per_person_at_booking": services[3].price_per_person,
                    "total_price": services[3].price_per_person * 3,
                    "status": "pending",
                },
            )

        post_data = [
            (users["alice"], "Epic Sunrise on the Flatirons", "trip_report", cats.get("backpacks"),
             "Just got back from guiding a sunrise hike up the First Flatiron. The alpenglow was unreal.", "Boulder, CO"),
            (users["dan"], "Avalanche Safety Reminder", "tip", cats.get("skis"),
             "With the recent storm cycle, the Wasatch snowpack is touchy. Check the UAC forecast.", "Salt Lake City, UT"),
            (users["emma"], "Best Beginner MTB Trails in Bend?", "question", cats.get("bikes"),
             "A friend is visiting next week and wants to try mountain biking. What would you recommend?", "Bend, OR"),
            (users["bob"], "Trail Cleanup Day - April 15", "event", None,
             "Organizing a volunteer trail cleanup day on the Colorado Trail near Waterton Canyon.", "Denver, CO"),
            (users["cara"], "Pacific Crest Trail Section Hike Report", "trip_report", cats.get("backpacks"),
             "Spent 5 days on the PCT through the Three Sisters Wilderness. Wildflowers were incredible.", "Portland, OR"),
        ]
        posts = []
        for author, title, ptype, cat, body, loc in post_data:
            post, _ = CommunityPost.objects.get_or_create(
                title=title,
                author=author,
                defaults={"body": body, "post_type": ptype, "category": cat, "location_name": loc},
            )
            posts.append(post)

        if posts:
            CommunityComment.objects.get_or_create(
                post=posts[0], author=users["bob"],
                defaults={"body": "Incredible shot! I need to get up there before winter."},
            )
            CommunityComment.objects.get_or_create(
                post=posts[2], author=users["alice"],
                defaults={"body": "Phil's Trail is perfect for beginners!"},
            )

        wl, _ = Wishlist.objects.get_or_create(user=users["bob"], name="Summer Trip Gear")
        if items:
            WishlistItem.objects.get_or_create(wishlist=wl, gear_item=items[4])
            WishlistItem.objects.get_or_create(wishlist=wl, gear_item=items[6])
        if services:
            WishlistItem.objects.get_or_create(wishlist=wl, guide_service=services[0])

        thread, _ = MessageThread.objects.get_or_create(
            gear_item=items[0] if items else None,
            defaults={},
        )
        thread.participants.add(users["alice"], users["bob"])
        Message.objects.get_or_create(
            thread=thread, sender=users["bob"],
            defaults={"body": "Hey Alice! Is your tent available next weekend?"},
        )
        Message.objects.get_or_create(
            thread=thread, sender=users["alice"],
            defaults={"body": "Hi Bob! Yes it is — go ahead and book it."},
        )

        self.stdout.write(self.style.SUCCESS(
            f"Seeded: {User.objects.count()} users, "
            f"{Category.objects.count()} categories, "
            f"{GearItem.objects.count()} gear items, "
            f"{Booking.objects.count()} bookings, "
            f"{GuideProfile.objects.count()} guide profiles, "
            f"{GuideService.objects.count()} guide services, "
            f"{CommunityPost.objects.count()} community posts, "
            f"{Wishlist.objects.count()} wishlists"
        ))
