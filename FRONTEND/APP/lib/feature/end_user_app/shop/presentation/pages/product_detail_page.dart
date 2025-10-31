import 'dart:convert';

import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/core/core.dart';
import 'package:ionhive_water_purifier/utils/widgets/webview_screen.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/shop/domain/models/product_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/shop/presentation/controllers/shop_controller.dart';
import 'package:ionhive_water_purifier/utils/widgets/button/custom_button.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ProductDetailPage extends StatefulWidget {
  final ProductModel product;

  const ProductDetailPage({super.key, required this.product});

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  late final PageController _pageController;
  late final WebViewController _webViewController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();

    _pageController = PageController()
      ..addListener(() {
        setState(() {
          _currentPage = _pageController.page?.round() ?? 0;
          debugPrint('Current page: $_currentPage');
        });
      });

    final sessionController = Get.find<SessionController>();
    final token = sessionController.token.value;
    final userId = sessionController.userId.value;
    final emailId = sessionController.emailId.value;
    final baseUrl =
        dotenv.env['BASE_URL_WEBVIEW'] ?? 'http://192.168.1.222:5050/';

    final data = {
      'token': token,
      'user': {
        'email': emailId,
        'user_id': userId,
      }
    };

    final encodedData = Uri.encodeComponent(jsonEncode(data));
    final finalUrl = '$baseUrl?data=$encodedData';

    debugPrint("✅ WebView loading URL: $finalUrl");

    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) => debugPrint('🌐 WebView started: $url'),
          onPageFinished: (url) => debugPrint('✅ WebView finished: $url'),
        ),
      )
      ..loadRequest(Uri.parse(finalUrl));

    // Log product image URLs
    debugPrint('Product images: '
        '[mainImg: ${widget.product.mainImg}, '
        'subImg1: ${widget.product.subImg1}, '
        'subImg2: ${widget.product.subImg2}, '
        'subImg3: ${widget.product.subImg3}, '
        'subImg4: ${widget.product.subImg4}]');
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  List<Plan> _getPlansToDisplay() {
    if (widget.product.plans.isNotEmpty) {
      return widget.product.plans;
    }
    
    final Set<int> seenPlanIds = {};
    final List<Plan> allPlans = [];
    
    for (final duration in widget.product.duration) {
      for (final plan in duration.plans) {
        if (!seenPlanIds.contains(plan.plansId)) {
          seenPlanIds.add(plan.plansId);
          allPlans.add(plan);
        }
      }
    }
    
    return allPlans;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;

    // Collect all image URLs, null for empty slots
    final images = [
      widget.product.mainImg.isNotEmpty ? widget.product.mainImg : null,
      widget.product.subImg1.isNotEmpty ? widget.product.subImg1 : null,
      widget.product.subImg2.isNotEmpty ? widget.product.subImg2 : null,
      widget.product.subImg3.isNotEmpty ? widget.product.subImg3 : null,
      widget.product.subImg4.isNotEmpty ? widget.product.subImg4 : null,
    ];

    final validImages =
    images.where((img) => img != null).cast<String>().toList();
    debugPrint(
        'Valid images for PageView: $validImages (${validImages.length})');

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        body: Column(
          children: [
            SizedBox(
              height: screenHeight * 0.5,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (images.any((img) => img != null)) ...[
                    PageView.builder(
                      controller: _pageController,
                      itemCount: images.length,
                      itemBuilder: (context, index) {
                        final image = images[index];
                        if (image == null) {
                          return Container(
                            color: Colors.grey.shade200,
                            child: const Center(
                              child: Icon(
                                Icons.image_not_supported,
                                size: 50,
                                color: Colors.grey,
                              ),
                            ),
                          );
                        }
                        final imageUrl = '${Core.baseUrl}/upload/img/$image';
                        return SizedBox(
                          width: screenWidth,
                          height: screenHeight * 0.5,
                          child: CachedNetworkImage(
                            imageUrl: imageUrl,
                            fit: BoxFit.contain,
                            placeholder: (context, url) =>
                            const Center(child: CircularProgressIndicator()),
                            errorWidget: (context, url, error) => Container(
                              color: Colors.grey.shade200,
                              child: Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(
                                      Icons.broken_image,
                                      size: 50,
                                      color: Colors.grey,
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Image not found',
                                      style: theme.textTheme.bodySmall?.copyWith(
                                        color: Colors.grey,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withOpacity(0.3),
                            Colors.black.withOpacity(0.7),
                          ],
                        ),
                      ),
                    ),
                    Positioned(
                      top: 33,
                      left: 16,
                      right: 16,
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: () => Get.back(),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.black.withOpacity(0.5),
                              ),
                              child: const Icon(
                                Icons.arrow_back,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              widget.product.modelName,
                              style: theme.textTheme.headlineSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                shadows: [
                                  Shadow(
                                    color: Colors.black.withOpacity(0.5),
                                    offset: const Offset(0, 2),
                                    blurRadius: 4,
                                  ),
                                ],
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (images.length > 1)
                      Positioned(
                        bottom: 8,
                        left: 0,
                        right: 0,
                        child: Column(
                          children: [
                            SmoothPageIndicator(
                              controller: _pageController,
                              count: images.length,
                              effect: ExpandingDotsEffect(
                                activeDotColor: theme.colorScheme.primary,
                                dotColor: Colors.white.withOpacity(0.5),
                                dotHeight: 6,
                                dotWidth: 6,
                                spacing: 8,
                                expansionFactor: 2,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(left: 16),
                                  child: Opacity(
                                    opacity: _currentPage == 0 ? 0.3 : 1.0,
                                    child: GestureDetector(
                                      onTap: _currentPage > 0
                                          ? () {
                                        _pageController.previousPage(
                                          duration:
                                          const Duration(milliseconds: 300),
                                          curve: Curves.easeInOut,
                                        );
                                      }
                                          : null,
                                      child: Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.black.withOpacity(0.5),
                                        ),
                                        child: const Icon(
                                          Icons.arrow_left,
                                          color: Colors.white,
                                          size: 32,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.only(right: 16),
                                  child: Opacity(
                                    opacity: _currentPage == images.length - 1
                                        ? 0.3
                                        : 1.0,
                                    child: GestureDetector(
                                      onTap: _currentPage < images.length - 1
                                          ? () {
                                        _pageController.nextPage(
                                          duration:
                                          const Duration(milliseconds: 300),
                                          curve: Curves.easeInOut,
                                        );
                                      }
                                          : null,
                                      child: Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.black.withOpacity(0.5),
                                        ),
                                        child: const Icon(
                                          Icons.arrow_right,
                                          color: Colors.white,
                                          size: 32,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                  ] else ...[
                    Container(
                      color: Colors.grey.shade200,
                      child: const Center(
                        child: Icon(
                          Icons.image_not_supported,
                          size: 50,
                          color: Colors.grey,
                        ),
                      ),
                    ),
                    Positioned(
                      top: 33,
                      left: 16,
                      right: 16,
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: () => Get.back(),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.black.withOpacity(0.5),
                              ),
                              child: const Icon(
                                Icons.arrow_back,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              widget.product.modelName,
                              style: theme.textTheme.headlineSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                shadows: [
                                  Shadow(
                                    color: Colors.black.withOpacity(0.5),
                                    offset: const Offset(0, 2),
                                    blurRadius: 4,
                                  ),
                                ],
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Theme(
              data: Theme.of(context).copyWith(
                tabBarTheme: const TabBarThemeData(
                  dividerColor: Colors.transparent,
                ),
              ),
              child: TabBar(
                labelColor: theme.colorScheme.primary,
                unselectedLabelColor:
                theme.colorScheme.onSurface.withOpacity(0.6),
                indicatorColor: theme.colorScheme.primary,
                indicatorWeight: 3,
                tabs: const [
                  Tab(text: 'Details'),
                  Tab(text: 'Plans'),
                  Tab(text: 'Duration'),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                children: [
                  SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: AnimatedOpacity(
                      opacity: 1.0,
                      duration: const Duration(milliseconds: 500),
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: theme.colorScheme.onSurface.withOpacity(0.1),
                            width: 1,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Product Details',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: theme.colorScheme.primary,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                widget.product.productDetails,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: Colors.black,
                                  height: 1.4,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Specifications',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: theme.colorScheme.primary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                widget.product.productSpecifications.isNotEmpty
                                    ? widget.product.productSpecifications
                                    : 'Not available',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: Colors.black,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: AnimatedOpacity(
                      opacity: 1.0,
                      duration: const Duration(milliseconds: 500),
                      child: Column(
                        children: _getPlansToDisplay().map((plan) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: theme.colorScheme.onSurface
                                    .withOpacity(0.1),
                                width: 1,
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        plan.label,
                                        style: theme.textTheme.titleSmall
                                            ?.copyWith(
                                          fontWeight: FontWeight.w600,
                                          color: theme.colorScheme.primary,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        'Capacity: ${plan.capacity}',
                                        style:
                                        theme.textTheme.bodySmall?.copyWith(
                                          color: Colors.black,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    plan.price != null
                                        ? '₹${plan.price}'
                                        : 'N/A',
                                    style:
                                    theme.textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.green,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: AnimatedOpacity(
                      opacity: 1.0,
                      duration: const Duration(milliseconds: 500),
                      child: Column(
                        children: widget.product.duration.map((duration) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: theme.colorScheme.onSurface
                                    .withOpacity(0.1),
                                width: 1,
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    duration.durationTimeLimit,
                                    style: theme.textTheme.titleSmall?.copyWith(
                                      fontWeight: FontWeight.w600,
                                      color: theme.colorScheme.primary,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'GST: ${duration.gst}%',
                                        style:
                                        theme.textTheme.bodySmall?.copyWith(
                                          color: Colors.black,
                                        ),
                                      ),
                                      Text(
                                        'Discount: ${duration.discount}%',
                                        style:
                                        theme.textTheme.bodySmall?.copyWith(
                                          color: Colors.black,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Security Deposit: ₹${duration.securityDeposit}',
                                        style:
                                        theme.textTheme.bodySmall?.copyWith(
                                          color: Colors.black,
                                        ),
                                      ),
                                      if (duration.price != null)
                                        Text(
                                          'Price: ₹${duration.price}',
                                          style: theme.textTheme.bodySmall
                                              ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                            color: Colors.green,
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Obx(() {
                final controller = Get.find<ShopController>();
                return CustomButton(
                  text: "Subscribe Now",
                  isLoading: controller.isLoading.value,
                  onPressed: () {
                    FocusScope.of(context).unfocus();
                    Get.to(
                          () => WebViewScreen(
                        controller: _webViewController,
                      ),
                      transition: Transition.rightToLeft,
                      duration: const Duration(milliseconds: 300),
                    );
                  },
                  borderRadius: 16.0,
                  textStyle: theme.textTheme.bodyLarge!,
                  boxShadow: BoxShadow(
                    color: theme.primaryColor.withOpacity(0.5),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}
