import 'package:flutter/material.dart';

class LinearLoadingIndicator extends StatefulWidget {
  final Color color;
  final double height;
  final double widthFactor;

  const LinearLoadingIndicator({
    super.key,
    this.color = Colors.blueAccent,
    this.height = 4.0,
    this.widthFactor = 0.3,
  });

  @override
  _LinearLoadingIndicatorState createState() => _LinearLoadingIndicatorState();
}

class _LinearLoadingIndicatorState extends State<LinearLoadingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);

    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxWidth = constraints.maxWidth;
        final barWidth = maxWidth * widget.widthFactor;

        return Container(
          height: widget.height,
          width: maxWidth,
          decoration: BoxDecoration(
            color: widget.color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(widget.height / 2),
          ),
          child: AnimatedBuilder(
            animation: _animation,
            builder: (context, child) {
              return Align(
                alignment: Alignment(
                  _animation.value * 2 - 1, // Moves from -1 to 1
                  0,
                ),
                child: Container(
                  width: barWidth,
                  height: widget.height,
                  decoration: BoxDecoration(
                    color: widget.color,
                    borderRadius: BorderRadius.circular(widget.height / 2),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
