import 'package:ionhive_water_purifier/core/core.dart';
import 'package:ionhive_water_purifier/core/services/endpoint.dart';

class ProductUrl {
  static final Endpoint GetProductsWithPlan = Endpoint(
    url: '${Core.baseUrl}/api/website/products/productswithplan',
    method: 'GET',
  );
}
