import 'package:ionhive_water_purifier/feature/end_user_app/shop/data/api.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/shop/domain/models/product_model.dart';

class ShopRepository {
  final ProductApi _api = ProductApi();

  Future<List<ProductModel>> getProducts() async {
    final json = await _api.fetchProductsWithPlan();
    if (json['status'] == 'Success') {
      final List<dynamic> data = json['data'] ?? [];
      return data.map((json) => ProductModel.fromJson(json)).toList();
    } else {
      throw Exception('API returned failure status: ${json['status']}');
    }
  }
}
