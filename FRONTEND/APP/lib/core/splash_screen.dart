import 'dart:async';
import 'dart:math';

import 'package:aquapulse_app/core/controllers/session_controller.dart';
import 'package:aquapulse_app/feature/end_user_app/landing_page.dart';
import 'package:aquapulse_app/feature/service_installation_app/landing_page.dart';
import 'package:aquapulse_app/utils/debug/build_guard.dart';
import 'package:flutter/material.dart';
import 'package:flutter_blurhash/flutter_blurhash.dart';
import 'package:get/get.dart';
import 'package:aquapulse_app/feature/GettingStarted%20page.dart';
import 'package:aquapulse_app/utils/theme/theme_controller.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  final ThemeController _themeController = Get.find<ThemeController>();
  SessionController? _sessionController;
  bool _hasNavigated = false;
  bool _isInitialized = false;

  // Animation controllers
  late AnimationController _logoAnimationController;
  late AnimationController _dropFallAnimationController;
  late AnimationController _rippleAnimationController;
  late AnimationController _textAnimationController;

  // Animations
  late Animation<double> _logoScaleAnimation;
  late Animation<double> _logoOpacityAnimation;
  late Animation<double> _dropFallAnimation;
  late Animation<double> _rippleScaleAnimation;
  late Animation<double> _rippleOpacityAnimation;
  late Animation<double> _textSlideAnimation;
  late Animation<double> _textOpacityAnimation;

  // Water droplet positions

  // For scattered droplets
  final List<_ScatteredDroplet> _scatteredDroplets = [];
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _initializeWithDelay();
  }

  void _setupAnimations() {
    // Logo animation
    _logoAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _logoScaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoAnimationController,
        curve: Curves.elasticOut,
      ),
    );

    _logoOpacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoAnimationController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    // Water drop fall animation
    _dropFallAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _dropFallAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _dropFallAnimationController,
        curve: Curves.easeInOut,
      ),
    );

    // Ripple animation
    _rippleAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _rippleScaleAnimation = Tween<double>(begin: 0.0, end: 2.0).animate(
      CurvedAnimation(
        parent: _rippleAnimationController,
        curve: Curves.easeOut,
      ),
    );

    _rippleOpacityAnimation = Tween<double>(begin: 0.7, end: 0.0).animate(
      CurvedAnimation(
        parent: _rippleAnimationController,
        curve: Curves.easeOut,
      ),
    );

    // Text animation
    _textAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _textSlideAnimation = Tween<double>(begin: 50.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _textAnimationController,
        curve: Curves.easeOutCubic,
      ),
    );

    _textOpacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _textAnimationController,
        curve: Curves.easeIn,
      ),
    );

    // Start animations in sequence
    _logoAnimationController.forward();

    Future.delayed(const Duration(milliseconds: 800), () {
      _dropFallAnimationController.forward();
    });

    _dropFallAnimationController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _rippleAnimationController.forward();
        _textAnimationController.forward();
        _generateScatteredDroplets();
      }
    });

    // Add listener to update the UI
    _dropFallAnimation.addListener(() {
      setState(() {});
    });

    _rippleScaleAnimation.addListener(() {
      setState(() {});
    });
  }

  void _generateScatteredDroplets() {
    // Create 15-20 scattered droplets
    final count = 15 + _random.nextInt(6);

    for (int i = 0; i < count; i++) {
      final size = 4.0 + _random.nextDouble() * 8.0;
      final angle = _random.nextDouble() * 2 * pi;
      final distance = 20.0 + _random.nextDouble() * 100.0;
      final delay = _random.nextInt(500);
      final duration = 600 + _random.nextInt(800);

      _scatteredDroplets.add(_ScatteredDroplet(
        size: size,
        angle: angle,
        distance: distance,
        delay: delay,
        duration: duration,
      ));
    }
  }

  void _updateScatterDroplets() {
    final currentTime = DateTime.now().millisecondsSinceEpoch;
    final rippleStartTime = currentTime -
        (_dropFallAnimationController.duration!.inMilliseconds *
            _dropFallAnimationController.value);

    for (final droplet in _scatteredDroplets) {
      final elapsedTime = currentTime - rippleStartTime - droplet.delay;

      if (elapsedTime > 0) {
        final progress = (elapsedTime / droplet.duration).clamp(0.0, 1.0);
        droplet.progress = progress;
      }
    }
  }

  void _initializeWithDelay() {
    // Delay to allow controllers to be registered
    Future.delayed(const Duration(seconds: 3), () {
      _tryInitializeController();
    });
  }

  // Counter to limit retry attempts
  int _retryCount = 0;
  static const int _maxRetries = 10;

  void _tryInitializeController() {
    if (_isInitialized) return;

    // Increment retry counter
    _retryCount++;

    try {
      // Try to find the SessionController
      if (Get.isRegistered<SessionController>()) {
        _sessionController = Get.find<SessionController>();
        _setupNavigation();
        _isInitialized = true;
      } else if (_retryCount < _maxRetries) {
        // If not found and we haven't exceeded max retries, try again after a delay
        Future.delayed(
            const Duration(milliseconds: 500), _tryInitializeController);
      } else {
        // If we've exceeded max retries, navigate to GetStartedPage as fallback
        debugPrint(
            'Max retries exceeded, navigating to GetStartedPage as fallback');
        _navigateToFallback();
      }
    } catch (e) {
      debugPrint('Error initializing SessionController: $e');
      if (_retryCount < _maxRetries) {
        // Try again after a delay if we haven't exceeded max retries
        Future.delayed(
            const Duration(milliseconds: 500), _tryInitializeController);
      } else {
        // Navigate to fallback if max retries exceeded
        _navigateToFallback();
      }
    }
  }

  void _navigateToFallback() {
    if (!_hasNavigated) {
      _hasNavigated = true;
      // Use a safe navigation approach
      BuildGuard.runSafely(() {
        Future.delayed(const Duration(seconds: 3), () {
          Get.offAll(() => GetStartedPage(),
              transition: Transition.fadeIn,
              duration: const Duration(milliseconds: 600));
        });
      });
    }
  }

  void _setupNavigation() {
    if (_sessionController == null) return;

    ever(_sessionController!.isLoggedIn, (isLoggedIn) {
      BuildGuard.runSafely(() {
        if (_hasNavigated) return;
        _hasNavigated = true;

        if (isLoggedIn) {
          final role = _sessionController!.userRole.value;

          debugPrint("Login detected. Role ID: $role");

          if (role == 3) {
            // User (End User App)
            Get.offAll(() => AppUserLandingPage(),
                transition: Transition.fadeIn,
                duration: const Duration(milliseconds: 600));
          } else if (role == 2) {
            // Technician (Technician App)
            Get.offAll(
                () => TechnicianLandingPage(), // <-- replace with actual page
                transition: Transition.fadeIn,
                duration: const Duration(milliseconds: 600));
          } else {
            // Fallback or unknown role
            Get.offAll(() => GetStartedPage(),
                transition: Transition.fadeIn,
                duration: const Duration(milliseconds: 600));
          }
        } else {
          // Not logged in
          debugPrint("Navigating to GetStartedPage");
          Get.offAll(() => GetStartedPage(),
              transition: Transition.fadeIn,
              duration: const Duration(milliseconds: 600));
        }
      });
    });

    Future.delayed(const Duration(seconds: 1), () {
      _sessionController?.isLoggedIn.refresh(); // trigger the listener
    });
  }

  @override
  void dispose() {
    _logoAnimationController.dispose();
    _dropFallAnimationController.dispose();
    _rippleAnimationController.dispose();
    _textAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final theme = _themeController.currentThemeData;

    return Scaffold(
      body: AnimatedBuilder(
        animation: Listenable.merge([
          _logoAnimationController,
          _dropFallAnimationController,
          _rippleAnimationController,
          _textAnimationController,
        ]),
        builder: (context, child) {
          _updateScatterDroplets();
          return Stack(
            children: [
              // White background with blur effect during drop fall
              Opacity(
                opacity:
                    _dropFallAnimation.value * 0.3, // Subtle blur during fall
                child: BlurHash(
                  hash:
                      "LEHV6nWB2yk8pyo0adR*.7kCMdnj", // Simple blur hash for white background
                  imageFit: BoxFit.cover,
                  duration: const Duration(milliseconds: 500),
                ),
              ),
              Container(
                color: theme.scaffoldBackgroundColor,
              ),
              // Water drop, scatter, and ripple animation
              Center(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Ripple effect
                    if (_rippleAnimationController.value > 0)
                      Transform.scale(
                        scale: _rippleScaleAnimation.value,
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: theme.colorScheme.primary.withOpacity(
                              _rippleOpacityAnimation.value,
                            ),
                          ),
                        ),
                      ),

                    // Scattered droplets
                    ..._buildScatteredDroplets(theme),

                    // Logo with scale and fade animation
                    Transform.scale(
                      scale: _logoScaleAnimation.value,
                      child: Opacity(
                        opacity: _logoOpacityAnimation.value,
                        child: Image.asset(
                          'assets/Image/aquapulse_logo.png',
                          width: size.width * 0.5,
                          height: size.width * 0.5,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),

                    // Water drop falling animation
                    if (_dropFallAnimationController.value > 0 &&
                        _dropFallAnimationController.value < 1.0)
                      Positioned(
                        top: size.height * 0.25 +
                            _dropFallAnimation.value * size.height * 0.15,
                        child: Opacity(
                          opacity: 1.0 - _dropFallAnimation.value * 0.3,
                          child: Container(
                            width: 20,
                            height: 20 + _dropFallAnimation.value * 10,
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary.withOpacity(0.8),
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              // Text animation
              Positioned(
                bottom: size.height * 0.25,
                left: 0,
                right: 0,
                child: Transform.translate(
                  offset: Offset(0, _textSlideAnimation.value),
                  child: Opacity(
                    opacity: _textOpacityAnimation.value,
                    child: Column(
                      children: [
                        Text(
                          "AQUAPULSE",
                          style: TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                            color: theme.colorScheme.primary,
                            shadows: [
                              Shadow(
                                color: Colors.black.withOpacity(0.2),
                                blurRadius: 4,
                                offset: const Offset(2, 2),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          "Pure Water, Better Life",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: theme.colorScheme.primary.withOpacity(0.8),
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Loading indicator
              Positioned(
                bottom: size.height * 0.1,
                left: 0,
                right: 0,
                child: _buildLoadingIndicator(theme, size),
              ),
            ],
          );
        },
      ),
    );
  }

  List<Widget> _buildScatteredDroplets(ThemeData theme) {
    final List<Widget> droplets = [];

    for (final droplet in _scatteredDroplets) {
      if (droplet.progress > 0) {
        final x = cos(droplet.angle) * droplet.distance * droplet.progress;
        final y = sin(droplet.angle) * droplet.distance * droplet.progress;

        droplets.add(
          Transform.translate(
            offset: Offset(x, y),
            child: Opacity(
              opacity: (1 - droplet.progress) * 0.8,
              child: Container(
                width: droplet.size,
                height: droplet.size,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
        );
      }
    }

    return droplets;
  }

  Widget _buildLoadingIndicator(ThemeData theme, Size size) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: size.width * 0.5,
            height: 4,
            child: LinearProgressIndicator(
              value: null, // Indeterminate progress
              backgroundColor: theme.colorScheme.primary.withOpacity(0.2),
              valueColor:
                  AlwaysStoppedAnimation<Color>(theme.colorScheme.primary),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            "Loading...",
            style: TextStyle(
              fontSize: 14,
              color: theme.colorScheme.primary.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }
}

class _ScatteredDroplet {
  final double size;
  final double angle;
  final double distance;
  final int delay;
  final int duration;
  double progress = 0.0;

  _ScatteredDroplet({
    required this.size,
    required this.angle,
    required this.distance,
    required this.delay,
    required this.duration,
  });
}
