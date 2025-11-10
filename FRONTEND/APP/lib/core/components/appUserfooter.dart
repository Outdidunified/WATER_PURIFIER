import 'package:flutter/material.dart';
import 'package:ionhive_water_purifier/utils/responsive/responsive.dart';

class Footer extends StatelessWidget {
  final Function(int) onTabChanged;
  final int currentIndex;

  const Footer({
    super.key,
    required this.onTabChanged,
    required this.currentIndex,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final double iconSize = ResponsiveUtils.getResponsiveIconSize(context, 22);

    final double fontSize = ResponsiveUtils.getResponsiveFontSize(context, 12);

    return Container(
      margin: EdgeInsets.zero,
      padding: EdgeInsets.zero,
      child: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: currentIndex,
        onTap: onTabChanged,
        selectedItemColor: theme.primaryColor,
        unselectedItemColor: theme.iconTheme.color,
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        selectedFontSize: fontSize,
        unselectedFontSize: fontSize,
        items: [
          BottomNavigationBarItem(
            icon: Image.asset(
              currentIndex == 0
                  ? 'assets/icons/home.png'
                  : 'assets/icons/home_n.png',
              width: iconSize,
              height: iconSize,
              color: currentIndex == 0
                  ? theme.primaryColor
                  : theme.iconTheme.color,
            ),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Image.asset(
              currentIndex == 1
                  ? 'assets/icons/Analytics_Active.png'
                  : 'assets/icons/Analytics.png',
              width: iconSize,
              height: iconSize,
              color: currentIndex == 1
                  ? theme.primaryColor
                  : theme.iconTheme.color,
            ),
            label: 'Analytics',
          ),
          BottomNavigationBarItem(
            icon: Image.asset(
              currentIndex == 2
                  ? 'assets/icons/Shop_Active.png'
                  : 'assets/icons/Shop.png',
              width: iconSize,
              height: iconSize,
              color: currentIndex == 2
                  ? theme.primaryColor
                  : theme.iconTheme.color,
            ),
            label: 'Shop',
          ),
          BottomNavigationBarItem(
            icon: Icon(
              currentIndex == 3
                  ? Icons.devices
                  : Icons.devices_outlined,
              size: iconSize,
              color: currentIndex == 3
                  ? theme.primaryColor
                  : theme.iconTheme.color,
            ),
            label: 'Device Setup',
          ),
          BottomNavigationBarItem(
            icon: Image.asset(
              currentIndex == 4
                  ? 'assets/icons/Settings_Active.png'
                  : 'assets/icons/Settings.png',
              width: iconSize,
              height: iconSize,
              color: currentIndex == 4
                  ? theme.primaryColor
                  : theme.iconTheme.color,
            ),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
