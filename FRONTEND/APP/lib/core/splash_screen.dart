import 'dart:async';
import 'dart:math';

import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/landing_page.dart';
import 'package:ionhive_water_purifier/utils/debug/build_guard.dart';
import 'package:flutter/material.dart';
import 'package:flutter_blurhash/flutter_blurhash.dart';
import 'package:get/get.dart';
import 'package:ionhive_water_purifier/feature/GettingStarted%20page.dart';
import 'package:ionhive_water_purifier/utils/theme/theme_controller.dart';

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

  // Water droplets
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

    // Drop animation
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

    // Start animations
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

    _dropFallAnimation.addListener(() => setState(() {}));
    _rippleScaleAnimation.addListener(() => setState(() {}));
  }

  void _generateScatteredDroplets() {
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
    Future.delayed(const Duration(seconds: 3), () {
      _tryInitializeController();
    });
  }

  int _retryCount = 0;
  static const int _maxRetries = 10;

  void _tryInitializeController() {
    if (_isInitialized) return;
    _retryCount++;

    try {
      if (Get.isRegistered<SessionController>()) {
        _sessionController = Get.find<SessionController>();
        _setupNavigation();
        _isInitialized = true;
      } else if (_retryCount < _maxRetries) {
        Future.delayed(
            const Duration(milliseconds: 500), _tryInitializeController);
      } else {
        _navigateToFallback();
      }
    } catch (e) {
      debugPrint('Error initializing SessionController: $e');
      if (_retryCount < _maxRetries) {
        Future.delayed(
            const Duration(milliseconds: 500), _tryInitializeController);
      } else {
        _navigateToFallback();
      }
    }
  }

  void _navigateToFallback() {
    if (!_hasNavigated) {
      _hasNavigated = true;
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
            // ✅ End User
            Get.offAll(() => AppUserLandingPage(),
                transition: Transition.fadeIn,
                duration: const Duration(milliseconds: 600));
          } else {
            // ❌ No technician app anymore → always fallback
            Get.offAll(() => GetStartedPage(),
                transition: Transition.fadeIn,
                duration: const Duration(milliseconds: 600));
          }
        } else {
          debugPrint("Navigating to GetStartedPage");
          Get.offAll(() => GetStartedPage(),
              transition: Transition.fadeIn,
              duration: const Duration(milliseconds: 600));
        }
      });
    });

    Future.delayed(const Duration(seconds: 1), () {
      _sessionController?.isLoggedIn.refresh();
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
              // Background
              Opacity(
                opacity: _dropFallAnimation.value * 0.3,
                child: const BlurHash(
                  hash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
                  imageFit: BoxFit.cover,
                  duration: Duration(milliseconds: 500),
                ),
              ),
              Container(color: theme.scaffoldBackgroundColor),

              // Center animations
              Center(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Ripple
                    if (_rippleAnimationController.value > 0)
                      Transform.scale(
                        scale: _rippleScaleAnimation.value,
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: theme.colorScheme.primary
                                .withOpacity(_rippleOpacityAnimation.value),
                          ),
                        ),
                      ),

                    // Scattered droplets
                    ..._buildScatteredDroplets(theme),

                    // Logo
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

                    // Falling drop
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

              // Title & subtitle
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
                          "IONHIVE",
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

              // Loading
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
    return _scatteredDroplets.map((droplet) {
      if (droplet.progress <= 0) return const SizedBox.shrink();
      final x = cos(droplet.angle) * droplet.distance * droplet.progress;
      final y = sin(droplet.angle) * droplet.distance * droplet.progress;

      return Transform.translate(
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
      );
    }).toList();
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
