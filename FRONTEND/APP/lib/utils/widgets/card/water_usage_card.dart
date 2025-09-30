import 'package:ionhive_water_purifier/utils/animation/water_wave_painter.dart';
import 'package:flutter/material.dart';
import 'dart:math' as math;

class WaterUsageCard extends StatefulWidget {
  final double waterUsed;
  final int waterLimit;
  final double width;

  const WaterUsageCard({
    super.key,
    required this.waterUsed,
    required this.waterLimit,
    required this.width,
  });

  @override
  State<WaterUsageCard> createState() => _WaterUsageCardState();
}

class _WaterUsageCardState extends State<WaterUsageCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late double progress;

  @override
  void initState() {
    super.initState();
    progress = widget.waterLimit > 0
        ? (widget.waterUsed / widget.waterLimit).clamp(0.0, 1.0)
        : 0.0;
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;

    return AnimatedOpacity(
      opacity: 1.0,
      duration: const Duration(milliseconds: 500),
      child: Card(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        elevation: 0,
        child: Container(
          width: widget.width,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                theme.colorScheme.surface,
                theme.colorScheme.primary.withOpacity(0.05),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          padding: EdgeInsets.all(screenWidth * 0.04),
          child: Row(
            children: [
              Container(
                height: screenWidth * 0.25,
                width: screenWidth * 0.25,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: theme.colorScheme.primary.withOpacity(0.3),
                    width: 1.5,
                  ),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    ShaderMask(
                      shaderCallback: (Rect bounds) {
                        return LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [
                            theme.colorScheme.primary.withOpacity(0.10),
                            theme.colorScheme.primary.withOpacity(0.10),
                            Colors.transparent,
                          ],
                          stops: [0.0, progress, progress],
                        ).createShader(bounds);
                      },
                      blendMode: BlendMode.srcATop,
                      child: Container(
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    ClipOval(
                      child: AnimatedBuilder(
                        animation: _controller,
                        builder: (context, child) {
                          return CustomPaint(
                            painter: WaterWavePainter(
                              progress: progress,
                              waveColor:
                                  theme.colorScheme.primary.withOpacity(0.10),
                              animationValue: _controller.value * 2 * math.pi,
                            ),
                            child: SizedBox(
                              height: screenWidth * 0.25,
                              width: screenWidth * 0.25,
                            ),
                          );
                        },
                      ),
                    ),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          widget.waterUsed < 1.0
                              ? "${(widget.waterUsed * 1000).toStringAsFixed(1)}"
                              : "${widget.waterUsed.toStringAsFixed(1)}",
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.primary,
                            fontSize: screenWidth * 0.06,
                          ),
                        ),
                        Text(
                          "of ${widget.waterLimit}",
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurface.withOpacity(0.8),
                            fontSize: screenWidth * 0.03,
                          ),
                        ),
                        Text(
                          widget.waterUsed < 1.0 ? "ml" : "Ltrs",
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurface.withOpacity(0.8),
                            fontSize: screenWidth * 0.03,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(width: screenWidth * 0.04),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Water Consumed",
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: screenWidth * 0.045,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.waterUsed < 1.0
                          ? "You've used ${(widget.waterUsed * 1000).toStringAsFixed(1)} ml out of your ${widget.waterLimit}-liter plan."
                          : "You've used ${widget.waterUsed.toStringAsFixed(1)} liters out of your ${widget.waterLimit}-liter plan.",
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.6),
                        fontSize: screenWidth * 0.035,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
