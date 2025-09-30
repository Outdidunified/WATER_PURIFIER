import 'package:ionhive_water_purifier/utils/widgets/button/custom_button.dart';
import 'package:ionhive_water_purifier/utils/widgets/input_field/email_inputfield.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/auth/presentation/controllers/auth_controller.dart';
// import 'package:ionhive_water_purifier/feature/end_user_app/landing_page.dart'
//     show AppUserLandingPage;
import 'package:url_launcher/url_launcher.dart';

class AppUserLoginPage extends StatelessWidget {
  final int userrole;

  AppUserLoginPage({super.key, required this.userrole});
  final controller = Get.put(AppUserAuthController());

  @override
  Widget build(BuildContext context) {
    controller.validationError.value = null; // Reset validation error

    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor, // Dynamic background
      body: Stack(
        children: [
          // Subtle water ripple background
          _buildRippleBackground(theme),
          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: Center(
                    child: SingleChildScrollView(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24.0, vertical: 16.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Header with AQUA branding
                            _buildHeader(theme),
                            const SizedBox(height: 40),
                            // Glassmorphic login card
                            _buildLoginCard(context, theme),
                            const SizedBox(height: 24),
                            // Terms and conditions
                            _buildTermsAndConditions(theme),
                            const SizedBox(height: 24),
                            // Continue as guest button
                            _buildGuestButton(theme),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                // Footer
                _buildFooter(theme),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRippleBackground(ThemeData theme) {
    return AnimatedBackground(
      theme: theme,
      child: Container(color: Colors.transparent),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return AnimatedOpacity(
      opacity: 1.0,
      duration: const Duration(milliseconds: 800),
      child: Column(
        children: [
          ShaderMask(
            shaderCallback: (bounds) => LinearGradient(
              colors: [theme.primaryColor, theme.primaryColor],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ).createShader(bounds),
            child: Text(
              "IONHIVE",
              style: theme.textTheme.headlineLarge?.copyWith(
                color: theme.primaryColor,
                fontSize: 30,
                fontWeight: FontWeight.bold,
                letterSpacing: 7,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 12),
          AnimatedSlide(
            offset: const Offset(0, 0),
            duration: const Duration(milliseconds: 1000),
            child: Text(
              "Stay Hydrated.\nTrack Your Water Intake.",
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onBackground,
                fontSize: 16,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginCard(BuildContext context, ThemeData theme) {
    return AnimatedSlide(
      offset: const Offset(0, 0),
      duration: const Duration(milliseconds: 1200),
      child: Container(
        padding: const EdgeInsets.all(24.0),
        decoration: BoxDecoration(
          color: theme.cardTheme.color, // Glassmorphic effect from theme
          borderRadius: (theme.cardTheme.shape as RoundedRectangleBorder?)
                  ?.borderRadius
                  .resolve(Directionality.of(context)) ??
              BorderRadius.circular(12),
          border:
              (theme.cardTheme.shape as RoundedRectangleBorder?)?.side != null
                  ? Border.all(
                      color: (theme.cardTheme.shape as RoundedRectangleBorder)
                          .side
                          .color,
                      width: (theme.cardTheme.shape as RoundedRectangleBorder)
                          .side
                          .width,
                    )
                  : null,
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.secondary.withOpacity(0.1),
              blurRadius: 60,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          children: [
            Obx(() {
              return EmailInput(
                controller: controller.emailController,
                errorText: controller.validationError.value,
                onChanged: (value) {
                  // Call your validation here
                  controller.validationError.value = controller.validateEmail();
                },
                readOnly: controller.isLoading.value,
              );
            }),
            const SizedBox(height: 16),
            Obx(() {
              return CustomButton(
                text: "Get OTP",
                isLoading: controller.isLoading.value,
                onPressed: () {
                  FocusScope.of(context).unfocus();
                  controller.handleGetOTP();
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
          ],
        ),
      ),
    );
  }

  Widget _buildTermsAndConditions(ThemeData theme) {
    return AnimatedOpacity(
      opacity: 1.0,
      duration: const Duration(milliseconds: 1400),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Obx(() {
            return Transform.translate(
              offset: const Offset(0, -10),
              child: Checkbox(
                value: controller.isChecked.value,
                onChanged: (value) {
                  controller.isChecked.value = value ?? false;
                },
                activeColor: theme.primaryColor,
                checkColor: theme.colorScheme.onPrimary,
                side: BorderSide(
                  color: theme.colorScheme.onBackground,
                  width: 1,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            );
          }),
          const SizedBox(width: 8),
          Flexible(
            child: RichText(
              text: TextSpan(
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onBackground,
                ),
                children: [
                  const TextSpan(text: "By continuing, I accept the "),
                  WidgetSpan(
                    child: GestureDetector(
                      onTap: () async {
                        final url = Uri.parse(
                            "https://ionhive_water_purifier.in/terms-and-service");
                        if (await canLaunchUrl(url)) {
                          await launchUrl(url,
                              mode: LaunchMode.externalApplication);
                        }
                      },
                      child: Text(
                        "Terms & Conditions",
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.primaryColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const TextSpan(text: " and "),
                  WidgetSpan(
                    child: GestureDetector(
                      onTap: () async {
                        final url = Uri.parse(
                            "https://ionhive_water_purifier.in/privacy-policy");
                        if (await canLaunchUrl(url)) {
                          await launchUrl(url,
                              mode: LaunchMode.externalApplication);
                        }
                      },
                      child: Text(
                        "Privacy Policy",
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.primaryColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGuestButton(ThemeData theme) {
    return AnimatedOpacity(
      opacity: 1.0,
      duration: const Duration(milliseconds: 1400),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(width: 8),
          Flexible(
            child: RichText(
              text: TextSpan(
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onBackground,
                ),
                children: [
                  const TextSpan(
                    text:
                        "By continuing, you can explore our app and website. Please explore our ",
                  ),
                  WidgetSpan(
                    child: GestureDetector(
                      // onTap: () async {
                      //   Get.to(
                      //     AppUserLandingPage(),
                      //     transition: Transition.rightToLeft,
                      //     duration: const Duration(milliseconds: 300),
                      //   );
                      //   },
                      child: Text(
                        "Guest Mode",
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.primaryColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const TextSpan(text: " and "),
                  WidgetSpan(
                    child: GestureDetector(
                      onTap: () async {
                        final url = Uri.parse(
                            "https://ionhive_water_purifier.in/terms-and-service");
                        if (await canLaunchUrl(url)) {
                          await launchUrl(url,
                              mode: LaunchMode.externalApplication);
                        }
                      },
                      child: Text(
                        "ionhive.com",
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.primaryColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const TextSpan(text: "."),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Align(
        alignment: Alignment.center,
        child: Text(
          "Powered by\nAQUA Innovations",
          textAlign: TextAlign.center,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onBackground,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

class AnimatedBackground extends StatefulWidget {
  final Widget child;
  final ThemeData theme;

  const AnimatedBackground(
      {super.key, required this.child, required this.theme});

  @override
  _AnimatedBackgroundState createState() => _AnimatedBackgroundState();
}

class _AnimatedBackgroundState extends State<AnimatedBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller =
        AnimationController(vsync: this, duration: const Duration(seconds: 12))
          ..repeat(reverse: true);
    _animation = Tween<double>(begin: 0, end: 300).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = widget.theme;
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Stack(
          children: [
            Positioned(
              top: _animation.value - 200,
              left: -50,
              child: Container(
                height: 200,
                width: 200,
                decoration: BoxDecoration(
                  color: theme.primaryColor.withOpacity(0.05),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Positioned(
              bottom: 200 - _animation.value,
              right: -50,
              child: Container(
                height: 150,
                width: 150,
                decoration: BoxDecoration(
                  color: theme.primaryColor.withOpacity(0.07),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            widget.child,
          ],
        );
      },
    );
  }
}

class RipplePainter extends CustomPainter {
  final double animationValue;
  final Color rippleColor;

  RipplePainter({required this.animationValue, required this.rippleColor});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = size.width * 0.8;

    for (int i = 0; i < 3; i++) {
      final progress = (animationValue + i * 0.3) % 1.0;
      final radius = maxRadius * progress;
      final opacity = (1.0 - progress) * 0.2;

      final paint = Paint()
        ..color = (rippleColor).withOpacity(opacity)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2;

      canvas.drawCircle(center, radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant RipplePainter oldDelegate) {
    return oldDelegate.animationValue != animationValue ||
        oldDelegate.rippleColor != rippleColor;
  }
}
