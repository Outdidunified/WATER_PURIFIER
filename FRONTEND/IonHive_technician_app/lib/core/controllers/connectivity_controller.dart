import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ionhive_technician_app/utils/debug/build_guard.dart';
// import 'package:ionhive_water_purifier/utils/widgets/snackbar/custom_snackbar.dart';

class ConnectivityController extends GetxController {
  final Connectivity _connectivity = Connectivity();
  late StreamSubscription<ConnectivityResult> _subscription;

  RxBool isConnected = false.obs; // Initialize as false to avoid state mismatch
  String? lastRoute; // Store the last visited screen

  @override
  void onInit() {
    super.onInit();

    // Perform the initial check immediately
    checkConnection();
    _subscription =
        _connectivity.onConnectivityChanged.listen(_updateConnectionStatus);
  }

  Future<void> checkConnection() async {
    ConnectivityResult result = await _connectivity.checkConnectivity();
    _updateConnectionStatus(result);
  }

  void _updateConnectionStatus(ConnectivityResult result) {
    // Use BuildGuard to prevent state changes during build
    BuildGuard.runSafely(() {
      bool wasConnected = isConnected.value;
      isConnected.value = (result != ConnectivityResult.none);

      // Only perform navigation if GetX is properly initialized and has a valid context
      if (Get.context == null) {
        debugPrint('GetX context not available, skipping navigation');
        return;
      }

      // Additional safety check for navigation readiness
      try {
        final _ = Get.currentRoute;
      } catch (e) {
        debugPrint('GetX navigation not ready: $e');
        return;
      }

      // If offline, navigate to NoInternetScreen
      if (!isConnected.value) {
        if (lastRoute == null || lastRoute != '/noInternet') {
          try {
            lastRoute = Get.currentRoute.isNotEmpty ? Get.currentRoute : '/';
          } catch (e) {
            lastRoute = '/';
          }
        }
        try {
          if (Get.currentRoute != '/noInternet') {
            Get.toNamed('/noInternet');
          }
        } catch (e) {
          debugPrint('Navigation error to NoInternetScreen: $e');
        }
      }
      // If connection is restored, navigate back to the last route
      else if (wasConnected != isConnected.value && isConnected.value) {
        try {
          // CustomSnackbar.showSuccess(message: "Internet Restored!");
          if (lastRoute != null && lastRoute != '/noInternet') {
            Future.delayed(const Duration(milliseconds: 500), () {
              Get.offNamed(lastRoute!);
            });
          }
        } catch (e) {
          debugPrint('Navigation error to lastRoute: $e');
        }
      }
    });
  }

  @override
  void onClose() {
    _subscription.cancel();
    super.onClose();
  }
}
