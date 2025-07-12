import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'dart:math' as math;
import 'package:aquapulse_app/feature/end_user_app/landing_page_controller.dart';

class SubscriptionPromptPage extends StatelessWidget {
  const SubscriptionPromptPage({super.key});

  @override
  Widget build(BuildContext context) {
    final AppUserLandingPageController controller =
        Get.find<AppUserLandingPageController>();

    return Scaffold(
      body: Stack(
        children: [
          // Gradient Background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.teal, Colors.blue],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
          ),
          // Bubble Animation Overlay
          const BubbleBackground(),
          // Main Content
          SafeArea(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 24.0, vertical: 40.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Header Section with Wave Background
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          height:
                              180, // Increased height for larger wave effect
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.white.withOpacity(
                                    0.3), // Slightly increased opacity
                                Colors.white.withOpacity(0.15),
                              ],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ),
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                        Column(
                          children: [
                            FadeInDown(
                              duration: const Duration(milliseconds: 800),
                              child: Text(
                                "Dive into AquaPulse Premium!",
                                style: GoogleFonts.poppins(
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  shadows: [
                                    const Shadow(
                                      color: Colors.black26,
                                      offset: Offset(2, 2),
                                      blurRadius: 4,
                                    ),
                                  ],
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                            const SizedBox(height: 12),
                            FadeInDown(
                              duration: const Duration(milliseconds: 1000),
                              child: Text(
                                "Unlock a world of smart water management with exclusive features.",
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  color: Colors.white.withOpacity(0.9),
                                  height: 1.5,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 40),

                    // Benefits Section
                    Text(
                      "What You’ll Get",
                      style: GoogleFonts.poppins(
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 20),
                    _buildBenefitTile(
                      context,
                      icon: Icons.water_drop,
                      title: "Smart Water Tracking",
                      description: "Real-time insights to optimize your usage.",
                      delay: 200,
                    ),
                    _buildBenefitTile(
                      context,
                      icon: Icons.analytics,
                      title: "In-Depth Analytics",
                      description: "Personalized reports to reduce waste.",
                      delay: 400,
                    ),
                    _buildBenefitTile(
                      context,
                      icon: Icons.notifications_active,
                      title: "Intelligent Alerts",
                      description: "Stay ahead with leak and overuse alerts.",
                      delay: 600,
                    ),
                    const SizedBox(height: 40),

                    // Product Showcase Section
                    Text(
                      "Our Premium Features",
                      style: GoogleFonts.poppins(
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 20),
                    _buildProductCard(
                      context,
                      imageUrl: "assets/Image/aquapulse_logo.png",
                      title: "Water Tracker",
                      description: "Precision tracking for every drop.",
                      delay: 200,
                    ),
                    _buildProductCard(
                      context,
                      imageUrl: "assets/Image/aquapulse_logo.png",
                      title: "Smart Leak Detector",
                      description: "Protect your home with smart detection.",
                      delay: 400,
                    ),
                    const SizedBox(height: 40),

                    // Call-to-Action Button
                    ZoomIn(
                      duration: const Duration(milliseconds: 800),
                      child: GestureDetector(
                        onTap: () {
                          // Navigate to ShopPage by updating the page index
                          controller.changePage(2);
                        },
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 18),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [
                                Colors.orange,
                                Colors.redAccent,
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Center(
                            child: Text(
                              "Purchase Now!",
                              style: GoogleFonts.poppins(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBenefitTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String description,
    required int delay,
  }) {
    return FadeInLeft(
      duration: const Duration(milliseconds: 600),
      delay: Duration(milliseconds: delay),
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: Colors.white.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    Colors.white.withOpacity(0.4),
                    Colors.white.withOpacity(0.2),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Icon(icon, color: Colors.white, size: 36),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(
    BuildContext context, {
    required String imageUrl,
    required String title,
    required String description,
    required int delay,
  }) {
    return FadeInRight(
      duration: const Duration(milliseconds: 600),
      delay: Duration(milliseconds: delay),
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 10),
        child: Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          elevation: 8,
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                gradient: LinearGradient(
                  colors: [
                    Colors.white,
                    Colors.grey.shade100,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 8,
                          spreadRadius: 2,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: Image.asset(
                        imageUrl,
                        width: 90,
                        height: 90,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return const Icon(
                            Icons.broken_image,
                            size: 90,
                            color: Colors.grey,
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: GoogleFonts.poppins(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          description,
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            color: Colors.black54,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Bubble Background Widget
class BubbleBackground extends StatefulWidget {
  const BubbleBackground({super.key});

  @override
  _BubbleBackgroundState createState() => _BubbleBackgroundState();
}

class _BubbleBackgroundState extends State<BubbleBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  List<Bubble> bubbles = [];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();

    // Generate 15 bubbles with random properties
    for (int i = 0; i < 15; i++) {
      bubbles.add(Bubble(
        x: math.Random().nextDouble() * 400,
        y: math.Random().nextDouble() * 800,
        radius: math.Random().nextDouble() * 20 + 10,
        speed: math.Random().nextDouble() * 2 + 1,
      ));
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          painter: BubblePainter(bubbles: bubbles, time: _controller.value),
          size: Size.infinite,
        );
      },
    );
  }
}

class Bubble {
  double x;
  double y;
  double radius;
  double speed;

  Bubble({
    required this.x,
    required this.y,
    required this.radius,
    required this.speed,
  });
}

class BubblePainter extends CustomPainter {
  final List<Bubble> bubbles;
  final double time;

  BubblePainter({required this.bubbles, required this.time});

  @override
  void paint(Canvas canvas, Size size) {
    // Sort bubbles by radius (largest to smallest) to create layering effect
    bubbles.sort((a, b) => b.radius.compareTo(a.radius));

    for (var bubble in bubbles) {
      // Calculate opacity based on size (larger bubbles are more transparent)
      double opacity =
          0.1 + (bubble.radius / 30) * 0.2; // Ranges from 0.1 to 0.3
      final paint = Paint()
        ..style = PaintingStyle.fill
        ..color = Colors.white.withOpacity(opacity.clamp(0.1, 0.3));

      // Update bubble position (move upwards)
      bubble.y -= bubble.speed;
      // Add a slight horizontal sway
      bubble.x += math.sin(bubble.y * 0.02) * 0.5;

      // Reset bubble to the bottom if it goes off-screen
      if (bubble.y < -bubble.radius) {
        bubble.y = size.height + bubble.radius;
        bubble.x = math.Random().nextDouble() * size.width;
      }

      // Draw the bubble
      canvas.drawCircle(
        Offset(bubble.x, bubble.y),
        bubble.radius,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
