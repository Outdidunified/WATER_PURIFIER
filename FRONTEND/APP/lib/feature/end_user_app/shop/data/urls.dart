import 'package:aquapulse_app/core/core.dart';
import 'package:aquapulse_app/core/services/endpoint.dart';

class ProductUrl {
  static final Endpoint GetProductsWithPlan = Endpoint(
    url: '${Core.baseUrl}/api/website/products/productswithplan',
    method: 'GET',
  );
}
