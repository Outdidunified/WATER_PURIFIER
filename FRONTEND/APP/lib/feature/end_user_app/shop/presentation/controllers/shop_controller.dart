import 'package:ionhive_water_purifier/feature/end_user_app/shop/domain/models/product_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/shop/domain/repositories/shop_repository.dart';
import 'package:get/get.dart';

class ShopController extends GetxController {
  var products = <ProductModel>[].obs;
  var isLoading = true.obs;
  var errorMessage = ''.obs;

  final ShopRepository _shopRepository = ShopRepository();

  @override
  void onInit() {
    super.onInit();
    fetchProducts();
  }

  Future<void> fetchProducts() async {
    isLoading.value = true;
    errorMessage.value = '';

    try {
      final response = await _shopRepository.getProducts();

      if (response.isNotEmpty) {
        products.assignAll(response);
      } else {
        errorMessage.value = "products not found.";
      }
    } catch (e) {
      errorMessage.value = "$e";
    } finally {
      isLoading.value = false;
    }
  }
}
