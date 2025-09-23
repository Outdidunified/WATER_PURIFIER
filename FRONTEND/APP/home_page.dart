import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart'; // For animations
import 'dart:ui'; // For glassmorphism effect

class TechnicianHomePage extends StatelessWidget {
  const TechnicianHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    // Responsive breakpoints
    final isSmallScreen = size.width < 360;
    final isTablet = size.width >= 600 && size.width < 1024;
    final isDesktop = size.width >= 1024;

    // For tablet and desktop, we'll use a different layout
    if (isTablet || isDesktop) {
      return Scaffold(
        body: SafeArea(
          child: Column(
            children: [
              // Header Widget
              HeaderWidget(isSmallScreen: false),
              // Main Content with Row layout for larger screens
              Expanded(
                child: Container(
                  color: theme.scaffoldBackgroundColor,
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Left side - Task Summary Cards in a column for larger screens
                        Expanded(
                          flex: isDesktop ? 1 : 2,
                          child: SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Task Summary Cards in a column for larger screens
                                TaskSummaryCard(
                                  icon: Icons.check_circle,
                                  title: 'Completed',
                                  count: '5',
                                  gradientColors: [
                                    theme.colorScheme.primary.withOpacity(0.3),
                                    theme.colorScheme.primary.withOpacity(0.5),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                TaskSummaryCard(
                                  icon: Icons.assignment,
                                  title: 'Assigned',
                                  count: '3',
                                  gradientColors: [
                                    theme.colorScheme.secondary
                                        .withOpacity(0.3),
                                    theme.colorScheme.secondary
                                        .withOpacity(0.5),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                        // Divider for desktop
                        if (isDesktop)
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16.0),
                            child: VerticalDivider(),
                          ),
                        // Right side - Task List
                        Expanded(
                          flex: isDesktop ? 3 : 3,
                          child: SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            child: TaskListWidget(isSmallScreen: false),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Mobile layout (original)
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header Widget
            HeaderWidget(isSmallScreen: isSmallScreen),
            // Main Content
            Expanded(
              child: Container(
                color: theme.scaffoldBackgroundColor,
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Padding(
                    // Adjust padding based on screen size
                    padding: EdgeInsets.all(isSmallScreen ? 12.0 : 16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Task Summary Cards Widget
                        TaskSummaryWidget(isSmallScreen: isSmallScreen),
                        SizedBox(height: isSmallScreen ? 16 : 24),
                        Divider(
                          color:
                              theme.colorScheme.onBackground.withOpacity(0.1),
                          thickness: 1,
                        ),
                        SizedBox(height: isSmallScreen ? 12 : 16),
                        // Task List Widget
                        TaskListWidget(isSmallScreen: isSmallScreen),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class HeaderWidget extends StatelessWidget {
  final bool isSmallScreen;

  const HeaderWidget({
    super.key,
    this.isSmallScreen = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    return FadeInDown(
      duration: const Duration(milliseconds: 600),
      child: Container(
        padding: EdgeInsets.symmetric(
            horizontal: isSmallScreen ? 16 : 20,
            vertical: isSmallScreen ? 12 : 16),
        margin: EdgeInsets.symmetric(
            horizontal: isSmallScreen ? 12 : 16,
            vertical: isSmallScreen ? 6 : 8),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              theme.colorScheme.primary.withOpacity(isDarkMode ? 0.3 : 0.5),
              theme.colorScheme.primary.withOpacity(isDarkMode ? 0.1 : 0.3),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.primary.withOpacity(0.2),
              blurRadius: 20,
              spreadRadius: 2,
            ),
          ],
          border: Border.all(
            color: theme.colorScheme.onPrimary.withOpacity(0.2),
            width: 1,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Row(
              children: [
                // Profile Section
                Expanded(
                  child: Row(
                    children: [
                      Hero(
                        tag: 'profile_image',
                        child: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: theme.colorScheme.onPrimary,
                              width: 2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color:
                                    theme.colorScheme.primary.withOpacity(0.3),
                                blurRadius: 8,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                          child: ClipOval(
                            child: Image.asset(
                              'assets/icons/account.png',
                              fit: BoxFit.cover,
                              color: theme.colorScheme.onPrimary,
                              colorBlendMode: BlendMode.srcIn,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Technician Name',
                              style: theme.textTheme.titleMedium?.copyWith(
                                color: theme.colorScheme.onPrimary,
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              'Welcome Back!',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onPrimary
                                    .withOpacity(0.7),
                                fontSize: 12,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // Action Buttons
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildIconButton(
                      context,
                      icon: Icons.notifications,
                      onPressed: () =>
                          _showSnackBar(context, 'Notifications tapped'),
                    ),
                    const SizedBox(width: 4),
                    _buildIconButton(
                      context,
                      icon: Icons.logout,
                      onPressed: () => _showSnackBar(context, 'Logout tapped'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIconButton(BuildContext context,
      {required IconData icon, required VoidCallback onPressed}) {
    final theme = Theme.of(context);
    return Material(
      color: Colors.transparent,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(
            icon,
            size: 20,
            color: theme.colorScheme.onPrimary,
          ),
        ),
      ),
    );
  }

  void _showSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      duration: const Duration(seconds: 1),
    ));
  }
}

// Task Summary Widget
class TaskSummaryWidget extends StatelessWidget {
  final bool isSmallScreen;

  const TaskSummaryWidget({
    super.key,
    this.isSmallScreen = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return FadeInUp(
      duration: const Duration(milliseconds: 800),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: isSmallScreen ? 12 : 16,
        mainAxisSpacing: isSmallScreen ? 12 : 16,
        children: [
          TaskSummaryCard(
            icon: Icons.check_circle,
            title: 'Completed \nTask',
            count: '5',
            gradientColors: [
              theme.colorScheme.primary.withOpacity(0.3),
              theme.colorScheme.primary.withOpacity(0.5),
            ],
          ),
          TaskSummaryCard(
            icon: Icons.assignment,
            title: 'Assigned \nTask',
            count: '3',
            gradientColors: [
              theme.colorScheme.secondary.withOpacity(0.3),
              theme.colorScheme.secondary.withOpacity(0.5),
            ],
          ),
        ],
      ),
    );
  }
}

class TaskSummaryCard extends StatefulWidget {
  final IconData icon;
  final String title;
  final String count;
  final List<Color> gradientColors;
  final VoidCallback? onTap;

  const TaskSummaryCard({
    super.key,
    required this.icon,
    required this.title,
    required this.count,
    required this.gradientColors,
    this.onTap,
  });

  @override
  State<TaskSummaryCard> createState() => _TaskSummaryCardState();
}

class _TaskSummaryCardState extends State<TaskSummaryCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
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
    final theme = Theme.of(context);

    return Semantics(
      label: '${widget.title}: ${widget.count} tasks',
      child: GestureDetector(
        onTapDown: (_) => _controller.forward(),
        onTapUp: (_) {
          _controller.reverse();
          widget.onTap?.call();
        },
        onTapCancel: () => _controller.reverse(),
        child: ScaleTransition(
          scale: _scaleAnimation,
          child: Container(
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.all(20),
            constraints:
                const BoxConstraints(minHeight: 120, minWidth: double.infinity),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: widget.gradientColors,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: widget.gradientColors[0].withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: Colors.white.withOpacity(0.15),
                      child: Icon(widget.icon, size: 28, color: Colors.white),
                    ),
                    const Spacer(),
                    Text(
                      widget.count,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 24,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    widget.title,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: Colors.white.withOpacity(0.9),
                      fontWeight: FontWeight.w600,
                      fontSize: 10,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Task List Widget
class TaskListWidget extends StatelessWidget {
  final bool isSmallScreen;

  const TaskListWidget({
    super.key,
    this.isSmallScreen = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Today’s Tasks',
              style: theme.textTheme.titleLarge?.copyWith(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w700,
                fontSize: isSmallScreen ? 18 : 20,
              ),
            ),
            TextButton(
              onPressed: () => _showSnackBar(context, 'View all tapped'),
              style: TextButton.styleFrom(
                foregroundColor: theme.colorScheme.primary,
                textStyle: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              child: const Text('View All'),
            ),
          ],
        ),
        SizedBox(height: isSmallScreen ? 8 : 12),
        FadeInUp(
          duration: const Duration(milliseconds: 1000),
          child: Column(
            children: [
              TaskTile(
                title: 'Inspect Equipment',
                dueTime: '2:00 PM',
                status: 'In Progress',
                statusColor: theme.colorScheme.primary,
                isSmallScreen: isSmallScreen,
              ),
              SizedBox(height: isSmallScreen ? 8 : 12),
              TaskTile(
                title: 'Maintenance Check',
                dueTime: '4:00 PM',
                status: 'Pending',
                statusColor: theme.colorScheme.secondary,
                isSmallScreen: isSmallScreen,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class TaskTile extends StatelessWidget {
  final String title;
  final String dueTime;
  final String status;
  final Color statusColor;
  final bool isSmallScreen;

  const TaskTile({
    super.key,
    required this.title,
    required this.dueTime,
    required this.status,
    required this.statusColor,
    this.isSmallScreen = false,
  });

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'in progress':
        return Icons.timelapse;
      case 'pending':
        return Icons.schedule;
      case 'completed':
        return Icons.check_circle;
      default:
        return Icons.task;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: EdgeInsets.only(bottom: isSmallScreen ? 10 : 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [
            statusColor.withOpacity(0.05),
            theme.colorScheme.surface,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: statusColor.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: statusColor.withOpacity(0.2),
        ),
      ),
      child: ListTile(
        contentPadding: EdgeInsets.symmetric(
            horizontal: isSmallScreen ? 12 : 16,
            vertical: isSmallScreen ? 10 : 14),
        leading: CircleAvatar(
          backgroundColor: statusColor.withOpacity(0.1),
          child: Icon(
            _getStatusIcon(status),
            color: statusColor,
            size: 22,
          ),
        ),
        title: Text(
          title,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.bold,
            fontSize: isSmallScreen ? 14 : 16,
            color: theme.colorScheme.onSurface,
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Row(
            children: [
              Icon(Icons.access_time,
                  size: 14,
                  color: theme.colorScheme.onSurface.withOpacity(0.6)),
              const SizedBox(width: 4),
              Text(
                dueTime,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontSize: 12,
                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(50),
                ),
                child: Text(
                  status,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
        ),
        trailing: Icon(
          Icons.arrow_forward_ios,
          size: 16,
          color: theme.colorScheme.onSurface.withOpacity(0.4),
        ),
        onTap: () => _showSnackBar(context, '$title tapped'),
      ),
    );
  }
}

// Helper: Show SnackBar
void _showSnackBar(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message)),
  );
}
