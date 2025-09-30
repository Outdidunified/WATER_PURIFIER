import 'dart:math';

import 'package:ionhive_water_purifier/feature/end_user_app/auth/presentation/pages/login_page.dart';
import 'package:ionhive_water_purifier/utils/theme/theme_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';

class GetStartedPage extends StatefulWidget {
  const GetStartedPage({super.key});

  @override
  State<GetStartedPage> createState() => _GetStartedPageState();
}

class _GetStartedPageState extends State<GetStartedPage>
    with SingleTickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  double _currentScrollPosition = 0;
  final ThemeController _themeController = Get.find<ThemeController>();
  late AnimationController _animationController;
  late Animation<double> _particleAnimation;

  @override
  void initState() {
    super.initState();
    _pageController.addListener(() {
      setState(() {
        _currentScrollPosition = _pageController.page ?? 0;
      });
    });

    // Initialize animation controller for particle effects
    _animationController = AnimationController(
      duration: const Duration(seconds: 4),
      vsync: this,
    );

    _animationController.forward();
    _animationController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _animationController.reverse();
      } else if (status == AnimationStatus.dismissed) {
        _animationController.forward();
      }
    });

    _particleAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = _themeController.currentThemeData;
    final double screenHeight = MediaQuery.of(context).size.height;
    final double screenWidth = MediaQuery.of(context).size.width;

    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient
          AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  _getBackgroundColor(_currentScrollPosition, 0, theme),
                  _getBackgroundColor(_currentScrollPosition, 1, theme),
                  _getBackgroundColor(_currentScrollPosition, 2, theme),
                ],
              ),
            ),
          ),

          // Animated dot background
          Opacity(
            opacity: 0.08,
            child: AnimatedBuilder(
              animation: _animationController,
              builder: (context, child) {
                return Transform.scale(
                  scale: 1.0 + _particleAnimation.value * 0.05,
                  child: CustomPaint(
                    painter: DotPatternPainter(
                      opacity: 0.7 + _particleAnimation.value * 0.3,
                      color: theme.colorScheme.secondary,
                    ),
                    size: Size(screenWidth, screenHeight),
                  ),
                );
              },
            ),
          ),

          // PageView
          PageView(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentPage = index;
              });
            },
            children: [
              _buildOnboardingPage(
                context,
                "assets/Image/g1.png",
                "Water Quality",
                "Real-time monitoring of your water purification system",
                screenHeight,
                screenWidth,
                theme,
              ),
              _buildOnboardingPage(
                context,
                "assets/Image/g2.png",
                "Smart Alerts",
                "Get notified for maintenance and filter replacements",
                screenHeight,
                screenWidth,
                theme,
              ),
              _buildOnboardingPage(
                context,
                "assets/Image/g3.png",
                "Expert Support",
                "Direct access to water purification specialists",
                screenHeight,
                screenWidth,
                theme,
              ),
            ],
          ),

          // Page Indicator
          Positioned(
            bottom: screenHeight * 0.15,
            left: 0,
            right: 0,
            child: _buildCustomPageIndicator(theme),
          ),

          // Bottom Buttons
          Positioned(
            bottom: screenHeight * 0.05,
            left: screenWidth * 0.05,
            right: screenWidth * 0.05,
            child: _currentPage == 2
                ? _buildLoginOptions(context, screenHeight, theme)
                : _buildNextButton(context, screenHeight, theme),
          ),
        ],
      ),
    );
  }

  Widget _buildOnboardingPage(
      BuildContext context,
      String imagePath,
      String title,
      String description,
      double screenHeight,
      double screenWidth,
      ThemeData theme,
      ) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.1),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Transform.translate(
            offset: const Offset(0, -40),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              height: screenHeight * 0.23,
              curve: Curves.easeInOut,
              child: Image.asset(imagePath, fit: BoxFit.contain),
            ),
          ),

          // Title
          AnimatedBuilder(
            animation: _animationController,
            builder: (context, child) {
              return Transform.translate(
                offset: Offset(
                  0,
                  sin(_animationController.value * 2 * 3.14159) * 3,
                ),
                child: Text(
                  title,
                  style: GoogleFonts.poppins(
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    shadows: [
                      Shadow(
                        color: theme.colorScheme.secondary.withOpacity(0.5),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  textAlign: TextAlign.center,
                ),
              );
            },
          ),
          SizedBox(height: screenHeight * 0.02),

          // Description
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 500),
            child: Text(
              description,
              key: ValueKey<String>(description),
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w400,
                color: Colors.white.withOpacity(0.9),
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomPageIndicator(ThemeData theme) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(3, (index) {
        double scale = _currentPage == index ? 1.2 : 1.0;
        Color color = _currentPage == index
            ? Colors.white
            : Colors.white.withOpacity(0.5);

        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: const EdgeInsets.symmetric(horizontal: 6),
          width: _currentPage == index ? 24 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            boxShadow: _currentPage == index
                ? [
              BoxShadow(
                color: theme.colorScheme.secondary.withOpacity(0.5),
                blurRadius: 8,
                spreadRadius: 1,
              )
            ]
                : null,
          ),
          transform: Matrix4.identity()..scale(scale),
        );
      }),
    );
  }

  Widget _buildNextButton(
      BuildContext context, double screenHeight, ThemeData theme) {
    return ElevatedButton(
      onPressed: () {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: theme.colorScheme.primary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(50),
        ),
        padding: EdgeInsets.symmetric(vertical: screenHeight * 0.02),
        elevation: 5,
        shadowColor: Colors.black.withOpacity(0.3),
      ),
      child: Text(
        "Continue",
        style: GoogleFonts.poppins(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: theme.colorScheme.primary,
        ),
      ),
    );
  }

  Widget _buildLoginOptions(
      BuildContext context, double screenHeight, ThemeData theme) {
    return Column(
      children: [
        ElevatedButton(
          onPressed: () {
            Get.offAll(() => AppUserLoginPage(userrole: 3),
                transition: Transition.rightToLeft,
                duration: const Duration(milliseconds: 500));
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: theme.colorScheme.primary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(50),
            ),
            padding: EdgeInsets.symmetric(vertical: screenHeight * 0.02),
            minimumSize: Size(double.infinity, screenHeight * 0.065),
            elevation: 5,
            shadowColor: Colors.black.withOpacity(0.3),
          ),
          child: Text(
            "Get Started",
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.primary,
            ),
          ),
        ),
      ],
    );
  }

  Color _getBackgroundColor(double position, int pageIndex, ThemeData theme) {
    double value = (position - pageIndex).abs();
    value = value.clamp(0.0, 1.0);

    final Color primaryColor = theme.colorScheme.primary;
    final Color backgroundColor = theme.colorScheme.background;

    final Color startColor = primaryColor;
    final Color midColor = Color.lerp(primaryColor, backgroundColor, 0.3)!;
    final Color endColor = Color.lerp(primaryColor, backgroundColor, 0.6)!;

    if (pageIndex == 0 || pageIndex == 2) {
      return Color.lerp(startColor, midColor, value)!;
    } else if (pageIndex == 1) {
      return Color.lerp(midColor, endColor, value)!;
    } else {
      return backgroundColor;
    }
  }
}

// Custom painter for dot background
class DotPatternPainter extends CustomPainter {
  final double opacity;
  final Color color;

  DotPatternPainter({
    required this.opacity,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(opacity * 0.3)
      ..style = PaintingStyle.fill;

    const dotSize = 3.0;
    const spacing = 20.0;

    for (double x = 0; x < size.width; x += spacing) {
      for (double y = 0; y < size.height; y += spacing) {
        if ((x / spacing).floor() % 2 == (y / spacing).floor() % 2) {
          canvas.drawCircle(Offset(x, y), dotSize, paint);
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant DotPatternPainter oldDelegate) =>
      oldDelegate.opacity != opacity || oldDelegate.color != color;
}
