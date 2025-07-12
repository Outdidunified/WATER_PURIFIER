import 'package:aquapulse_app/feature/service_installation_app/home/presentation/pages/home_page.dart';
import 'package:aquapulse_app/utils/widgets/error/error_display_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:aquapulse_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';

class TaskDetailsPage extends StatefulWidget {
  const TaskDetailsPage({super.key});

  @override
  State<TaskDetailsPage> createState() => _TaskDetailsPageState();
}

class _TaskDetailsPageState extends State<TaskDetailsPage> {
  final TechnicianController technicianController =
      Get.find<TechnicianController>();

  final RxString selectedFilter = 'All'.obs;

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Task Details'),
        backgroundColor: Colors.blue[500],
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              technicianController.loadTasks();
              selectedFilter.value = 'All';
            },
          ),
        ],
      ),
      body: Obx(() {
        if (technicianController.isRefreshing.value) {
          return const Center(child: CircularProgressIndicator());
        } else if (technicianController.errorMessageTask.value.contains(
            '🔍 Resource not found. The requested information is unavailable.')) {
          // Special handling for "No tasks found" error
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 70),
            child: Center(
              child: DisplayWidgetForTechnician(
                errorMessage: "No tasks available for you at the moment.",
                assetPath: 'assets/icons/Task.png',
              ),
            ),
          );
        } else if (technicianController.errorMessageTask.value.isNotEmpty) {
          // Handle other errors
          return Center(
            child: DisplayWidgetForTechnician(
              errorMessage: technicianController.errorMessageTask.value,
              assetPath: 'assets/icons/error.png',
            ),
          );
        }

        // Check if there are no tasks
        if (technicianController.allTasks.isEmpty) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 70),
            child: Center(
              child: DisplayWidgetForTechnician(
                errorMessage: "No tasks available for you at the moment.",
                assetPath: 'assets/icons/Task.png',
              ),
            ),
          );
        }

        final totalTasks = technicianController.allTasks.length;
        final completedTasks = technicianController.getTaskCount('Completed');
        final pendingTasks = technicianController.getTaskCount('Pending');

        final filteredList = selectedFilter.value == 'All'
            ? technicianController.allTasks
            : technicianController.allTasks
                .where((task) =>
                    task.taskStatus?.toLowerCase() ==
                    selectedFilter.value.toLowerCase())
                .toList();

        // Check if filtered list is empty
        if (filteredList.isEmpty) {
          return SingleChildScrollView(
            child: Column(
              children: [
                // Summary Section
                Container(
                  padding: EdgeInsets.all(screenWidth * 0.04),
                  margin: EdgeInsets.symmetric(
                    horizontal: screenWidth * 0.04,
                    vertical: screenHeight * 0.02,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.blue[300]!, Colors.blue[500]!],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Task Overview',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: screenWidth * 0.05,
                        ),
                      ),
                      SizedBox(height: screenHeight * 0.01),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Total: $totalTasks',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: screenWidth * 0.04,
                            ),
                          ),
                          Text(
                            'Completed: $completedTasks',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: screenWidth * 0.04,
                            ),
                          ),
                          Text(
                            'Pending: $pendingTasks',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: screenWidth * 0.04,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Filter Chips
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.04),
                  child: _buildFilterChips(screenWidth),
                ),

                SizedBox(height: screenHeight * 0.02),

                // No tasks message for the filtered status
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 30),
                  child: Center(
                    child: DisplayWidgetForTechnician(
                      errorMessage:
                          "No ${selectedFilter.value} tasks available.",
                      assetPath: 'assets/icons/Task.png',
                    ),
                  ),
                ),
              ],
            ),
          );
        }

        return SingleChildScrollView(
          child: Column(
            children: [
              // Summary Section
              Container(
                padding: EdgeInsets.all(screenWidth * 0.04),
                margin: EdgeInsets.symmetric(
                  horizontal: screenWidth * 0.04,
                  vertical: screenHeight * 0.02,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue[300]!, Colors.blue[500]!],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Task Overview',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: screenWidth * 0.05,
                      ),
                    ),
                    SizedBox(height: screenHeight * 0.01),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Total: $totalTasks',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: screenWidth * 0.04,
                          ),
                        ),
                        Text(
                          'Completed: $completedTasks',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: screenWidth * 0.04,
                          ),
                        ),
                        Text(
                          'Pending: $pendingTasks',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: screenWidth * 0.04,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Filter Chips
              Padding(
                padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.04),
                child: _buildFilterChips(screenWidth),
              ),

              SizedBox(height: screenHeight * 0.02),

              // Task List
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: EdgeInsets.all(screenWidth * 0.04),
                itemCount: filteredList.length,
                itemBuilder: (context, index) {
                  final task = filteredList[index];
                  return TaskTile(
                    task: task,
                    isSmallScreen: screenWidth < 600,
                  );
                },
              ),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildFilterChips(double screenWidth) {
    return Obx(() {
      final allTasks = technicianController.allTasks;
      final statusOptions = ['All', 'Pending', 'In Progress', 'Completed'];

      // Build only chips with available tasks
      final availableChips = statusOptions.where((status) {
        if (status == 'All') return true; // Always include "All"
        return allTasks.any(
            (task) => task.taskStatus?.toLowerCase() == status.toLowerCase());
      }).toList();

      return Wrap(
        spacing: 8.0,
        runSpacing: 8.0,
        children: availableChips.map((status) {
          final count = status == 'All'
              ? allTasks.length
              : allTasks
                  .where((task) =>
                      task.taskStatus?.toLowerCase() == status.toLowerCase())
                  .length;

          return ChoiceChip(
            label: Text('$status ($count)'),
            selected: selectedFilter.value == status,
            onSelected: (_) => selectedFilter.value = status,
            selectedColor: Colors.blue[500],
            labelStyle: TextStyle(
              color: selectedFilter.value == status
                  ? Colors.white
                  : Colors.black87,
              fontWeight: FontWeight.w600,
            ),
            backgroundColor: Colors.grey[200],
            side: const BorderSide(color: Colors.transparent),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
          );
        }).toList(),
      );
    });
  }
}
