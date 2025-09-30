import 'package:ionhive_water_purifier/core/services/base_api_service.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/shop/data/urls.dart';

class ProductApi extends BaseApiService {
  Future<Map<String, dynamic>> fetchProductsWithPlan() async {
    return makeRequest<Map<String, dynamic>>(
      url: ProductUrl.GetProductsWithPlan.url,
      method: ProductUrl.GetProductsWithPlan.method,
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }
}
