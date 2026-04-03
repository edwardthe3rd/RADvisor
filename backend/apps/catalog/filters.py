import django_filters
from .models import GearItem


class GearItemFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="daily_rate", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="daily_rate", lookup_expr="lte")
    category_slug = django_filters.CharFilter(field_name="category__slug")
    category_group = django_filters.CharFilter(field_name="category__group")

    class Meta:
        model = GearItem
        fields = ["category", "city", "state", "condition"]
