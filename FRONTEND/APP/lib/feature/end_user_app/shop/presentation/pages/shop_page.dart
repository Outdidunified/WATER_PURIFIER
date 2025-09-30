import 'package:ionhive_water_purifier/core/core.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/pages/ContactSupportPage/contact_support_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/shop/domain/models/product_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/shop/presentation/controllers/shop_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/shop/presentation/pages/product_detail_page.dart';
import 'package:ionhive_water_purifier/utils/widgets/error/error_display_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shimmer/shimmer.dart';

class ShopPage extends StatelessWidget {
  const ShopPage({super.key});

  @override
  Widget build(BuildContext context) {
    Get.put(ShopController()); // Corrected controller name
    final shopController =
        Get.find<ShopController>(); // Corrected controller name
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Obx(() {
        if (shopController.isLoading.value) {
          return _buildShimmerLoading(context);
        } else if (shopController.errorMessage.value.isNotEmpty) {
          return ErrorDisplayWidget(
            errorMessage: shopController.errorMessage.value,
            onRetry: () {
              shopController.fetchProducts();
            },
          );
        } else {
          return Column(
            children: [
              _buildHeader(context),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: shopController.products.length,
                  itemBuilder: (context, index) {
                    final product = shopController.products[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: LinearGradient(
                          colors: [
                            theme.colorScheme.surface,
                            theme.colorScheme.surface.withOpacity(0.95),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: theme.shadowColor.withOpacity(0.05),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: _buildProductRow(context, product),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        }
      }),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final theme = Theme.of(context);
    final hour = DateTime.now().hour;

    String greeting;
    if (hour < 12) {
      greeting = "Good Morning";
    } else if (hour < 17) {
      greeting = "Good Afternoon";
    } else {
      greeting = "Good Evening";
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 48, 16, 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: Colors.black.withOpacity(0.1),
                child: Icon(
                  Icons.person_outline,
                  color: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    greeting,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    "Welcome to IonHive!",
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.black.withOpacity(0.7),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
          IconButton(
            onPressed: () {
              Get.to(
                () => ContactSupportPage(),
                transition: Transition.rightToLeft,
                duration: const Duration(milliseconds: 300),
              );
            },
            icon: Icon(
              Icons.headphones,
              color: theme.colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildProductRow(BuildContext context, ProductModel product) {
    final theme = Theme.of(context);

    final imageWidget = ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Image.network(
        '${Core.baseUrl}/upload/img/${product.mainImg}',
        width: 80,
        height: 80,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return Container(
            width: 80,
            height: 80,
            color: Colors.grey.shade200,
            child: const Center(
              child: Icon(
                Icons.broken_image,
                size: 40,
                color: Colors.grey,
              ),
            ),
          );
        },
      ),
    );

    final contentWidget = Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              product.modelName,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                fontSize: 14,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              product.productDetails,
              style: theme.textTheme.bodySmall?.copyWith(
                fontSize: 12,
                color: Colors.black87,
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Get.to(
                    () => ProductDetailPage(product: product),
                    transition: Transition.rightToLeft,
                    duration: const Duration(milliseconds: 300),
                  );
                },
                icon: const Icon(Icons.visibility, size: 16),
                label: const Text("View More", style: TextStyle(fontSize: 12)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  minimumSize: const Size(0, 32),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    return [imageWidget, contentWidget];
  }

  Widget _buildShimmerLoading(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;

    return Column(
      children: [
        _buildHeader(context),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: 3, // Show 3 shimmer items
            itemBuilder: (context, index) {
              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: theme.colorScheme.surface,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Shimmer.fromColors(
                    baseColor: Colors.grey[300]!,
                    highlightColor: Colors.grey[100]!,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            color: Colors.grey,
                          ),
                        ),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: screenWidth * 0.4,
                                  height: 14,
                                  color: Colors.grey,
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  width: screenWidth * 0.6,
                                  height: 12,
                                  color: Colors.grey,
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  width: screenWidth * 0.5,
                                  height: 12,
                                  color: Colors.grey,
                                ),
                                const SizedBox(height: 10),
                                Container(
                                  width: double.infinity,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(8),
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
