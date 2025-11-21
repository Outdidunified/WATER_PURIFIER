import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/pages/home_page.dart';
import 'package:ionhive_technician_app/utils/widgets/error/error_display_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:intl/intl.dart';

class TaskDetailsPage extends StatefulWidget {
  const TaskDetailsPage({super.key});

  @override
  State<TaskDetailsPage> createState() => _TaskDetailsPageState();
}

class _TaskDetailsPageState extends State<TaskDetailsPage> {
  final TechnicianController technicianController =
      Get.find<TechnicianController>();

  final RxString selectedFilter = 'All'.obs;
  final RxString dateFilter = 'Weekly'.obs;
  final Rx<DateTime?> selectedStartDate = Rx<DateTime?>(null);
  final Rx<DateTime?> selectedEndDate = Rx<DateTime?>(null);
  final Rx<DateTime?> customPickedDate = Rx<DateTime?>(null);
  final RxBool showCalendar = false.obs;

  @override
  void initState() {
    super.initState();
    _setDateRange('Weekly');
    WidgetsBinding.instance.addPostFrameCallback((_) {
      technicianController.loadRejectionHistory();
    });
  }

  void _setDateRange(String filter) {
    final now = DateTime.now();
    switch (filter) {
      case 'Weekly':
        selectedStartDate.value = now.subtract(Duration(days: now.weekday - 1));
        selectedEndDate.value = now;
        break;
      case 'Monthly':
        selectedStartDate.value = DateTime(now.year, now.month, 1);
        selectedEndDate.value = now;
        break;
      case 'Yearly':
        selectedStartDate.value = DateTime(now.year, 1, 1);
        selectedEndDate.value = now;
        break;
      default:
        selectedStartDate.value = null;
        selectedEndDate.value = null;
    }
  }

  bool _isTaskInDateRange(Task task) {
    final taskDate = task.assignedDate;
    if (taskDate == null) return false;
    
    if (customPickedDate.value != null) {
      return taskDate.year == customPickedDate.value!.year &&
             taskDate.month == customPickedDate.value!.month &&
             taskDate.day == customPickedDate.value!.day;
    }
    
    if (dateFilter.value == 'All') return true;
    if (selectedStartDate.value == null || selectedEndDate.value == null) return true;
    
    return taskDate.isAfter(selectedStartDate.value!) && 
           taskDate.isBefore(selectedEndDate.value!.add(Duration(days: 1)));
  }

  bool _isRejectedTaskInDateRange(Task task) {
    final rejectedDate = task.rejectedDate;
    if (rejectedDate == null) return false;
    
    if (customPickedDate.value != null) {
      return rejectedDate.year == customPickedDate.value!.year &&
             rejectedDate.month == customPickedDate.value!.month &&
             rejectedDate.day == customPickedDate.value!.day;
    }
    
    if (dateFilter.value == 'All') return true;
    if (selectedStartDate.value == null || selectedEndDate.value == null) return true;
    
    return rejectedDate.isAfter(selectedStartDate.value!) && 
           rejectedDate.isBefore(selectedEndDate.value!.add(Duration(days: 1)));
  }

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
            onPressed: () async {
              await Future.wait([
                technicianController.loadTasks(),
                technicianController.loadRejectionHistory(),
              ]);
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
        final inProgressTasks = technicianController.getTaskCount('In Progress');
        final pendingTasks = technicianController.getTaskCount('Pending');
        final rejectedTasks = technicianController.rejectionHistory.length;

        List<Task> filteredList;
        if (selectedFilter.value.toLowerCase() == 'rejected') {
          final convertedRejectionData = technicianController.rejectionHistory.map((item) {
            if (item is Map<String, dynamic>) {
              return Task.fromJson(item);
            }
            return item;
          }).toList();
          filteredList = convertedRejectionData.cast<Task>()
              .where((task) => _isRejectedTaskInDateRange(task))
              .toList();
        } else {
          filteredList = technicianController.allTasks
              .where((task) {
                final statusMatch = selectedFilter.value == 'All' ||
                    task.taskStatus?.toLowerCase() ==
                        selectedFilter.value.toLowerCase();
                final dateMatch = _isTaskInDateRange(task);
                return statusMatch && dateMatch;
              })
              .toList();
        }

        // Check if filtered list is empty
        if (filteredList.isEmpty) {
          return SingleChildScrollView(
            child: Column(
              children: [
                // Summary Section
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: screenWidth * 0.06,
                    vertical: screenWidth * 0.03,
                  ),
                  margin: EdgeInsets.symmetric(
                    horizontal: screenWidth * 0.04,
                    vertical: screenHeight * 0.015,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.blue[500],
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
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
                          fontWeight: FontWeight.w600,
                          fontSize: screenWidth * 0.045,
                        ),
                      ),
                      SizedBox(height: screenHeight * 0.012),
                      GridView.count(
                        crossAxisCount: 3,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        childAspectRatio: 3.0,
                        crossAxisSpacing: screenWidth * 0.02,
                        mainAxisSpacing: screenHeight * 0.005,
                        children: [
                          _buildOverviewStat('Total', totalTasks.toString()),
                          _buildOverviewStat('Completed', completedTasks.toString()),
                          _buildOverviewStat('In Progress', inProgressTasks.toString()),
                          _buildOverviewStat('Pending', pendingTasks.toString()),
                          _buildOverviewStat('Rejected', rejectedTasks.toString()),
                        ],
                      ),
                    ],
                  ),
                ),

                // Status Filter Chips
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: screenWidth * 0.04,
                    vertical: screenHeight * 0.01,
                  ),
                  child: _buildFilterChips(screenWidth),
                ),

                SizedBox(height: screenHeight * 0.015),

                // Date Filter Section with Calendar and Dropdown
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: screenWidth * 0.04,
                    vertical: screenHeight * 0.01,
                  ),
                  child: _buildDateFilterSection(screenWidth, screenHeight),
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
                padding: EdgeInsets.symmetric(
                  horizontal: screenWidth * 0.06,
                  vertical: screenWidth * 0.03,
                ),
                margin: EdgeInsets.symmetric(
                  horizontal: screenWidth * 0.04,
                  vertical: screenHeight * 0.015,
                ),
                decoration: BoxDecoration(
                  color: Colors.blue[500],
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
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
                        fontWeight: FontWeight.w600,
                        fontSize: screenWidth * 0.045,
                      ),
                    ),
                    SizedBox(height: screenHeight * 0.012),
                    GridView.count(
                      crossAxisCount: 3,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      childAspectRatio: 3.0,
                      crossAxisSpacing: screenWidth * 0.02,
                      mainAxisSpacing: screenHeight * 0.005,
                      children: [
                        _buildOverviewStat('Completed', completedTasks.toString()),
                        _buildOverviewStat('In Progress', inProgressTasks.toString()),
                        _buildOverviewStat('Pending', pendingTasks.toString()),
                        _buildOverviewStat('Rejected', rejectedTasks.toString()),
                      ],
                    ),
                  ],
                ),
              ),

              // Status Filter Chips
              Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: screenWidth * 0.04,
                  vertical: screenHeight * 0.01,
                ),
                child: _buildFilterChips(screenWidth),
              ),

              SizedBox(height: screenHeight * 0.015),

              // Date Filter Section with Calendar and Dropdown
              Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: screenWidth * 0.04,
                  vertical: screenHeight * 0.01,
                ),
                child: _buildDateFilterSection(screenWidth, screenHeight),
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

  Widget _buildOverviewStat(String label, String count) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 10,
            fontWeight: FontWeight.w500,
            height: 1.0,
          ),
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 1),
        Text(
          count,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 15,
            height: 1.0,
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChips(double screenWidth) {
    return Obx(() {
      final allTasks = technicianController.allTasks;
      final statusOptions = ['Completed', 'In Progress', 'Pending', 'Rejected'];

      // Build only chips with available tasks
      final availableChips = statusOptions.where((status) {
        if (status == 'Rejected') {
          return technicianController.rejectionHistory.isNotEmpty;
        }
        return allTasks.any(
            (task) => task.taskStatus?.toLowerCase() == status.toLowerCase());
      }).toList();

      return Wrap(
        spacing: 6.0,
        runSpacing: 6.0,
        children: availableChips.map((status) {
          final count = status == 'Rejected'
              ? technicianController.rejectionHistory.length
              : allTasks
                  .where((task) =>
                      task.taskStatus?.toLowerCase() == status.toLowerCase())
                  .length;

          return SizedBox(
            width: (screenWidth - screenWidth * 0.08 - 12) / 3,
            child: FilterChip(
              label: Text('$status ($count)', overflow: TextOverflow.ellipsis),
              selected: selectedFilter.value == status,
              onSelected: (_) => selectedFilter.value = status,
              backgroundColor: Colors.grey[100],
              selectedColor: Colors.blue[500],
              labelStyle: TextStyle(
                color: selectedFilter.value == status
                    ? Colors.white
                    : Colors.grey[800],
                fontWeight: FontWeight.w500,
                fontSize: 11,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(
                  color: selectedFilter.value == status 
                    ? Colors.blue[500]! 
                    : Colors.grey[300]!,
                  width: 1,
                ),
              ),
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            ),
          );
        }).toList(),
      );
    });
  }

  Widget _buildDateFilterDropdown(double screenWidth) {
    return Obx(() {
      final dateOptions = ['All', 'Weekly', 'Monthly', 'Yearly'];

      return Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: DropdownButton<String>(
          value: dateFilter.value,
          underline: SizedBox(),
          isDense: true,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          items: dateOptions.map((option) {
            return DropdownMenuItem<String>(
              value: option,
              child: Text(
                option,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey[800],
                ),
              ),
            );
          }).toList(),
          onChanged: (value) {
            if (value != null) {
              dateFilter.value = value;
              _setDateRange(value);
              customPickedDate.value = null;
            }
          },
          icon: Icon(
            Icons.arrow_drop_down,
            color: Colors.grey[600],
            size: 18,
          ),
        ),
      );
    });
  }

  Widget _buildDateFilterSection(double screenWidth, double screenHeight) {
    return Obx(() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select Filter Method',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.grey[800],
            ),
          ),
          SizedBox(height: screenHeight * 0.01),
          SizedBox(
            height: 40,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => showCalendar.value = !showCalendar.value,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.blue[500],
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: Colors.blue[500]!,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Icon(
                        Icons.calendar_today,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ),
                SizedBox(width: screenWidth * 0.02),
                Expanded(
                  child: Theme(
                    data: Theme.of(context).copyWith(
                      dropdownMenuTheme: DropdownMenuThemeData(
                        menuStyle: MenuStyle(
                          backgroundColor: WidgetStatePropertyAll(Colors.white),
                          surfaceTintColor: WidgetStatePropertyAll(Colors.white),
                        ),
                      ),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      alignment: Alignment.center,
                      child: DropdownButton<String>(
                        value: dateFilter.value,
                        underline: SizedBox(),
                        isDense: false,
                        isExpanded: true,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        dropdownColor: Colors.white,
                        items: ['Weekly', 'Monthly', 'Yearly'].map((option) {
                          return DropdownMenuItem<String>(
                            value: option,
                            child: Text(
                              option,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: Colors.grey[800],
                              ),
                            ),
                          );
                        }).toList(),
                        onChanged: (value) {
                          if (value != null) {
                            showCalendar.value = false;
                            dateFilter.value = value;
                            _setDateRange(value);
                            customPickedDate.value = null;
                          }
                        },
                        icon: Icon(
                          Icons.arrow_drop_down,
                          color: Colors.grey[600],
                          size: 16,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: screenHeight * 0.012),
          if (showCalendar.value)
            Padding(
              padding: EdgeInsets.only(bottom: screenHeight * 0.012),
              child: SizedBox(
                height: 300,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.grey[300]!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: EdgeInsets.all(screenWidth * 0.02),
                  child: Theme(
                    data: Theme.of(context).copyWith(
                      textTheme: TextTheme(
                        bodySmall: TextStyle(color: Colors.grey[700], fontSize: 10),
                        bodyMedium: TextStyle(color: Colors.grey[700], fontSize: 10),
                        labelSmall: TextStyle(color: Colors.grey[700], fontSize: 9),
                        headlineSmall: TextStyle(color: Colors.grey[800], fontSize: 11),
                      ),
                    ),
                    child: CalendarDatePicker(
                      initialDate: customPickedDate.value ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now(),
                      onDateChanged: (date) {
                        customPickedDate.value = date;
                      },
                    ),
                  ),
                ),
              ),
            ),
        ],
      );
    });
  }
}
