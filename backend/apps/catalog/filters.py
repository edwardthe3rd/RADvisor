import django_filters
from .models import Business, Equipment, GearItem


class GearItemFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="daily_rate", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="daily_rate", lookup_expr="lte")
    category_slug = django_filters.CharFilter(field_name="category__slug")
    category_group = django_filters.CharFilter(field_name="category__group")

    class Meta:
        model = GearItem
        fields = ["category", "city", "state", "condition"]


class BusinessFilter(django_filters.FilterSet):
    # Filter by category slug or high-level group (the discovery page uses both).
    category = django_filters.CharFilter(field_name="categories__slug")
    category_group = django_filters.CharFilter(field_name="categories__group")
    min_rating = django_filters.NumberFilter(field_name="google_rating", lookup_expr="gte")
    max_price_level = django_filters.NumberFilter(field_name="price_level", lookup_expr="lte")

    class Meta:
        model = Business
        fields = ["city", "state"]


class EquipmentFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug")
    category_group = django_filters.CharFilter(field_name="category__group")
    business = django_filters.NumberFilter(field_name="business_id")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    class Meta:
        model = Equipment
        fields = ["price_unit", "is_available"]
