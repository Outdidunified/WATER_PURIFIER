import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/repositories/home_repository.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/pages/task_details_page.dart';
import 'package:ionhive_technician_app/utils/widgets/error/error_display_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

class TechnicianHomePage extends StatefulWidget {
  const TechnicianHomePage({super.key});

  @override
  State<TechnicianHomePage> createState() => _TechnicianHomePageState();
}

class _TechnicianHomePageState extends State<TechnicianHomePage> {
  late TechnicianController controller;

  @override
  void initState() {
    super.initState();
    controller = Get.find<TechnicianController>();
    // Load tasks only if not already loaded to avoid setState during build
    if (controller.allTasks.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Future.wait([
          controller.loadTasks(),
          controller.loadRejectionHistory(),
        ]);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final theme = Theme.of(context);
      final size = MediaQuery.of(context).size;
      final padding = size.width < 360 ? 12.0 : 16.0;
      final cardWidth = size.width < 360 ? 110.0 : 130.0;

      final isSmallScreen = size.width < 360;
      final isTablet = size.width >= 600 && size.width < 1024;
      final isDesktop = size.width >= 1024;

      // Show loading indicator for initial load
      if (controller.isRefreshing.value &&
          controller.allTasks.isEmpty &&
          controller.errorMessageTask.value.isEmpty) {
        return const Center(child: CircularProgressIndicator());
      }

      // Show error message if any
      if (controller.errorMessageTask.value.isNotEmpty) {
        return Center(
          child: ErrorDisplayWidget(
            errorMessage: controller.errorMessageTask.value,
            onRetry: controller.loadTasks,
          ),
        );
      }

      Widget body;
      if (isTablet || isDesktop) {
        body = Column(
          children: [
            HeaderWidget(
              isSmallScreen: isSmallScreen,
              onRefresh: () async {
                await Future.wait([
                  controller.loadTasks(),
                  controller.loadRejectionHistory(),
                ]);
              },
            ),
            Expanded(
              child: Container(
                color: theme.scaffoldBackgroundColor,
                padding: EdgeInsets.all(padding),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: isDesktop ? 1 : 1,
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        child: Container(
                          padding: EdgeInsets.all(padding),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Tasks Assigned',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurface.withOpacity(0.7),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              SizedBox(height: padding / 2),
                              Obx(() {
                                return TaskSummaryWidget(
                                  isSmallScreen: isSmallScreen,
                                  onFilter: (status) => controller.filterTasks(status),
                                  selectedStatusFilter: controller.selectedStatusFilter.value,
                                  completedCount: controller.allTasks.where((t) => t.taskStatus == 'Completed').length,
                                  inProgressCount: controller.allTasks.where((t) => t.taskStatus == 'In Progress').length,
                                  pendingCount: controller.allTasks.where((t) => t.taskStatus == 'Pending').length,
                                  rejectedCount: controller.rejectionHistory.length,
                                );
                              }),
                            ],
                          ),
                        ),
                      ),
                    ),
                    if (isDesktop)
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: padding),
                        child: const VerticalDivider(),
                      ),
                    Expanded(
                      flex: isDesktop ? 3 : 4,
                      child: RefreshIndicator(
                        onRefresh: () async {
                await Future.wait([
                  controller.loadTasks(),
                  controller.loadRejectionHistory(),
                ]);
              },
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          child: controller.isRefreshing.value
                              ? ShimmerTaskListWidget(
                                  isSmallScreen: isSmallScreen,
                                  padding: padding,
                                )
                              : TaskListWidget(
                                  tasks: controller.filteredTasks.value,
                                  isSmallScreen: isSmallScreen,
                                  onClearFilter: () =>
                                      controller.filterTasks(null),
                                  isFiltered:
                                      controller.selectedStatusFilter.value !=
                                          'Pending',
                                ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      } else {
        body = Column(
          children: [
            HeaderWidget(
              isSmallScreen: isSmallScreen,
              onRefresh: () async {
                await Future.wait([
                  controller.loadTasks(),
                  controller.loadRejectionHistory(),
                ]);
              },
            ),
            Expanded(
              child: Container(
                color: theme.scaffoldBackgroundColor,
                padding: EdgeInsets.all(padding),
                child: RefreshIndicator(
                  onRefresh: () async {
                await Future.wait([
                  controller.loadTasks(),
                  controller.loadRejectionHistory(),
                ]);
              },
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Tasks Assigned',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurface.withOpacity(0.7),
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                        SizedBox(height: padding / 2),
                        Obx(() {
                          return TaskSummaryWidget(
                            isSmallScreen: isSmallScreen,
                            onFilter: (status) => controller.filterTasks(status),
                            selectedStatusFilter: controller.selectedStatusFilter.value,
                            completedCount: controller.allTasks.where((t) => t.taskStatus == 'Completed').length,
                            inProgressCount: controller.allTasks.where((t) => t.taskStatus == 'In Progress').length,
                            pendingCount: controller.allTasks.where((t) => t.taskStatus == 'Pending').length,
                            rejectedCount: controller.rejectionHistory.length,
                          );
                        }),
                        SizedBox(height: padding),
                        controller.isRefreshing.value
                            ? ShimmerTaskListWidget(
                                isSmallScreen: isSmallScreen,
                                padding: padding,
                              )
                            : TaskListWidget(
                                tasks: controller.filteredTasks.value,
                                isSmallScreen: isSmallScreen,
                                onClearFilter: () =>
                                    controller.filterTasks(null),
                                isFiltered:
                                    controller.selectedStatusFilter.value !=
                                        'Pending',
                              ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      }

      return Scaffold(
        body: SafeArea(
          child: Stack(
            children: [body],
          ),
        ),
      );
    });
  }
}

/// Shimmer effect for TaskSummaryCard
class ShimmerTaskSummaryCard extends StatelessWidget {
  final double cardWidth;

  const ShimmerTaskSummaryCard({super.key, required this.cardWidth});

  @override
  Widget build(BuildContext context) {
    Theme.of(context);
    final padding = MediaQuery.of(context).size.width < 360 ? 8.0 : 12.0;

    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: SizedBox(
        width: cardWidth,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
              ),
            ),
            SizedBox(height: padding),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 16,
                  height: 16,
                  color: Colors.white,
                ),
                SizedBox(width: padding / 4),
                Column(
                  children: [
                    Container(
                      width: 60,
                      height: 10,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 2),
                    Container(
                      width: 20,
                      height: 2,
                      color: Colors.white,
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Shimmer effect for TaskSummaryWidget
class ShimmerTaskSummaryWidget extends StatelessWidget {
  final bool isSmallScreen;

  const ShimmerTaskSummaryWidget({super.key, this.isSmallScreen = false});

  @override
  Widget build(BuildContext context) {
    final padding = isSmallScreen ? 12.0 : 16.0;

    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: List.generate(3, (index) {
          return Expanded(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: padding / 4),
              child: ShimmerTaskSummaryCard(cardWidth: double.infinity),
            ),
          );
        }),
      ),
    );
  }
}

/// Shimmer effect for TaskListWidget
class ShimmerTaskListWidget extends StatelessWidget {
  final bool isSmallScreen;
  final double padding;

  const ShimmerTaskListWidget({
    super.key,
    this.isSmallScreen = false,
    required this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.all(padding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Shimmer.fromColors(
                baseColor: Colors.grey[300]!,
                highlightColor: Colors.grey[100]!,
                child: Container(
                  width: 100,
                  height: 20,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          SizedBox(height: padding / 2),
          Column(
            children: List.generate(3, (index) {
              return Shimmer.fromColors(
                baseColor: Colors.grey[300]!,
                highlightColor: Colors.grey[100]!,
                child: Container(
                  margin: EdgeInsets.only(bottom: padding / 2),
                  padding: EdgeInsets.all(padding),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: theme.colorScheme.onSurface.withOpacity(0.1),
                      width: 1,
                    ),
                  ),
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Container(
                      width: 24,
                      height: 24,
                      color: Colors.white,
                    ),
                    title: Container(
                      width: double.infinity,
                      height: 16,
                      color: Colors.white,
                    ),
                    subtitle: Padding(
                      padding: EdgeInsets.only(top: padding / 2),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 100,
                                height: 12,
                                color: Colors.white,
                              ),
                              const Spacer(),
                              Container(
                                width: 50,
                                height: 12,
                                color: Colors.white,
                              ),
                            ],
                          ),
                          SizedBox(height: padding / 4),
                          Container(
                            width: 80,
                            height: 14,
                            color: Colors.white,
                          ),
                        ],
                      ),
                    ),
                    trailing: Container(
                      width: 16,
                      height: 16,
                      color: Colors.white,
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

/// Placeholder page to display all tasks (not currently accessible).
class AllTasksPage extends StatelessWidget {
  final List<Task> allTasks;

  const AllTasksPage({super.key, required this.allTasks});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final padding = MediaQuery.of(context).size.width < 360 ? 12.0 : 16.0;
    final isSmallScreen = MediaQuery.of(context).size.width < 360;

    return Scaffold(
      appBar: AppBar(
        title: const Text('All Tasks'),
        backgroundColor: theme.colorScheme.primary,
      ),
      body: Container(
        padding: EdgeInsets.all(padding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'All Tasks (${allTasks.length})',
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w600,
                fontSize: isSmallScreen ? 18 : 20,
              ),
            ),
            SizedBox(height: padding / 2),
            if (allTasks.isEmpty)
              Padding(
                  padding: EdgeInsets.symmetric(vertical: padding),
                  child: Center(
                      child: DisplayWidget(
                    errorMessage: "No Task Available.",
                    assetPath:
                        'assets/icons/analysis_not_found.png', // Optional: Use a custom icon if available
                  )))
            else
              Expanded(
                child: ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  itemCount: allTasks.length,
                  itemBuilder: (context, index) {
                    return TaskTile(
                      task: allTasks[index],
                      isSmallScreen: isSmallScreen,
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Widget for the header section, displaying technician info and actions.
class HeaderWidget extends StatelessWidget {
  final bool isSmallScreen;
  final VoidCallback onRefresh;

  const HeaderWidget({
    super.key,
    this.isSmallScreen = false,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final padding = isSmallScreen ? 12.0 : 16.0;
    final currentDateTime = DateTime.now();

    return Container(
      padding: EdgeInsets.all(padding),
      margin: EdgeInsets.all(padding / 2),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.onSurface.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: theme.colorScheme.onSurface.withOpacity(0.2),
                  ),
                ),
                child: ClipOval(
                  child: Image.asset(
                    'assets/icons/account.png',
                    fit: BoxFit.cover,
                    color: theme.colorScheme.onSurface,
                    colorBlendMode: BlendMode.srcIn,
                  ),
                ),
              ),
              SizedBox(width: padding / 2),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome Back!',
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: theme.colorScheme.onSurface,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    DateFormat('MMM dd, hh:mm a').format(currentDateTime),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                      fontSize: 12,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ],
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildIconButton(
                context,
                icon: Icons.refresh,
                onPressed: onRefresh,
                color: theme.colorScheme.primary,
              ),
              SizedBox(width: padding / 4),
              _buildIconButton(
                context,
                icon: Icons.notification_add,
                onPressed: () => _showSnackBar(context, 'Notification tapped'),
                color: Colors.black,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildIconButton(
    BuildContext context, {
    required IconData icon,
    required VoidCallback onPressed,
    required Color color,
  }) {
    return Material(
      color: Colors.transparent,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.all(6),
          child: Icon(
            icon,
            size: 20,
            color: color,
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

/// Widget for displaying task summary cards (Completed, In Progress, Pending).
class TaskSummaryWidget extends StatelessWidget {
  final bool isSmallScreen;
  final Function(String?) onFilter;
  final String? selectedStatusFilter;
  final int completedCount;
  final int inProgressCount;
  final int pendingCount;
  final int rejectedCount;

  const TaskSummaryWidget({
    super.key,
    this.isSmallScreen = false,
    required this.onFilter,
    required this.selectedStatusFilter,
    required this.completedCount,
    required this.inProgressCount,
    required this.pendingCount,
    required this.rejectedCount,
  });

  @override
  Widget build(BuildContext context) {
    final padding = isSmallScreen ? 12.0 : 16.0;

    final List<Map<String, dynamic>> summaryData = [
      {
        'title': 'Pending',
        'count': pendingCount.toString(),
        'color': const Color(0xFFFF5722),
        'status': 'Pending',
      },
      {
        'title': 'Rejected',
        'count': rejectedCount.toString(),
        'color': Colors.redAccent,
        'status': 'Rejected',
      },
      {
        'title': 'In Progress',
        'count': inProgressCount.toString(),
        'color': const Color(0xFFFFC107),
        'status': 'In Progress',
      },
      {
        'title': 'Completed',
        'count': completedCount.toString(),
        'color': const Color(0xFF4CAF50),
        'status': 'Completed',
      },
    ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: summaryData.map((data) {
        return Expanded(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: padding / 4),
            child: TaskSummaryCard(
              title: data['title'],
              count: data['count'],
              color: data['color'],
              onTap: () => onFilter(data['status']),
              isSelected: selectedStatusFilter == data['status'],
              cardWidth: double.infinity,
            ),
          ),
        );
      }).toList(),
    );
  }
}

/// Widget for an individual task summary card.
class TaskSummaryCard extends StatelessWidget {
  final String title;
  final String count;
  final Color color;
  final VoidCallback? onTap;
  final bool isSelected;
  final double cardWidth;

  const TaskSummaryCard({
    super.key,
    required this.title,
    required this.count,
    required this.color,
    this.onTap,
    this.isSelected = false,
    required this.cardWidth,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final padding = MediaQuery.of(context).size.width < 360 ? 8.0 : 12.0;

    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: cardWidth,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color.withOpacity(0.1),
                border: Border.all(
                  color: isSelected ? color : Colors.transparent,
                  width: isSelected ? 3 : 1.5,
                ),
              ),
              child: Center(
                child: Text(
                  count,
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
              ),
            ),
            SizedBox(height: padding),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w600,
                    fontSize: 10,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 2),
                Container(
                  width: 20,
                  height: 2,
                  color: color,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Widget for displaying the list of tasks.
class TaskListWidget extends StatelessWidget {
  final List<Task> tasks;
  final bool isSmallScreen;
  final VoidCallback onClearFilter;
  final bool isFiltered;

  const TaskListWidget({
    super.key,
    required this.tasks,
    this.isSmallScreen = false,
    required this.onClearFilter,
    required this.isFiltered,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final padding = isSmallScreen ? 12.0 : 16.0;

    return Container(
      padding: EdgeInsets.all(padding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Tasks (${tasks.length})',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: isSmallScreen ? 18 : 20,
                ),
              ),
              if (isFiltered)
                TextButton(
                  onPressed: onClearFilter,
                  style: TextButton.styleFrom(
                    foregroundColor: theme.colorScheme.primary,
                    textStyle: theme.textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  child: const Text('Clear Filter'),
                ),
            ],
          ),
          SizedBox(height: padding / 2),
          if (tasks.isEmpty)
            Padding(
                padding: EdgeInsets.symmetric(vertical: 70),
                child: Center(
                    child: DisplayWidgetForTechnician(
                  errorMessage: "No tasks available for you at the moment.",
                  assetPath:
                      'assets/icons/Task.png', // Optional: Use a custom icon if available
                )))
          else
            Column(
              children: tasks.map((task) {
                return TaskTile(
                  task: task,
                  isSmallScreen: isSmallScreen,
                );
              }).toList(),
            ),
        ],
      ),
    );
  }
}

/// Widget for an individual task tile in the task list.
class TaskTile extends StatelessWidget {
  final Task task;
  final bool isSmallScreen;

  const TaskTile({
    super.key,
    required this.task,
    this.isSmallScreen = false,
  });

  IconData _getStatusIcon(String? status) {
    // Convert to lowercase and handle null case
    final statusLower = status?.toLowerCase() ?? '';

    switch (statusLower) {
      case 'in progress':
        return Icons.timelapse_rounded;
      case 'pending':
        return Icons.schedule_rounded;
      case 'completed':
        return Icons.check_circle_rounded;
      case 'rejected':
        return Icons.cancel_rounded;
      default:
        return Icons.task_alt_rounded;
    }
  }

  Color _getStatusColor(String? status) {
    // Convert to lowercase and handle null case
    final statusLower = status?.toLowerCase() ?? '';

    switch (statusLower) {
      case 'in progress':
        return const Color(0xFFFFC107);
      case 'pending':
        return const Color(0xFFFF5722);
      case 'completed':
        return const Color(0xFF4CAF50);
      case 'rejected':
        return Colors.redAccent;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final padding = isSmallScreen ? 8.0 : 12.0;
    final statusColor = _getStatusColor(task.taskStatus);
    final isCompleted = task.taskStatus?.toLowerCase() == 'completed';

    return Container(
      margin: EdgeInsets.only(bottom: padding / 2),
      padding: EdgeInsets.symmetric(horizontal: padding / 2, vertical: padding),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.onSurface.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        visualDensity: VisualDensity.compact,
        leading: Icon(
          _getStatusIcon(task.taskStatus),
          color: statusColor,
          size: isSmallScreen ? 20 : 24,
        ),
        title: Text(
          task.taskDescription == "null\nDirection: null" ||
                  task.taskDescription == null
              ? "No description available"
              : task.taskDescription!,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
            fontSize: isSmallScreen ? 12 : 13,
            color: Colors.black,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Padding(
          padding: EdgeInsets.only(top: padding / 2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    task.assignedDate != null
                        ? DateFormat('MMM dd, hh:mm a')
                            .format(task.assignedDate!.toLocal())
                        : 'Date not available',
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontSize: 12,
                      color: Colors.black.withOpacity(0.6),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: statusColor.withOpacity(0.3)),
                    ),
                    child: Text(
                      task.taskStatus ?? 'Unknown',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: padding / 2),
              Text(
                'Device ID: ${task.wpDeviceId ?? 'N/A'}',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontSize: 11,
                  color: Colors.black.withOpacity(0.6),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        trailing: isCompleted
            ? null
            : Icon(
                Icons.arrow_forward_ios_rounded,
                size: 16,
                color: theme.colorScheme.onSurface.withOpacity(0.3),
              ),
        onTap: isCompleted
            ? null
            : () {
                Get.to(
                  () => TaskDetailPage(task: task),
                  transition: Transition.rightToLeft,
                  duration: const Duration(milliseconds: 300),
                );
              },
      ),
    );
  }
}

