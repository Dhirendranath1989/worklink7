import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const SettingsDropdown = ({ isScrolled }) => {

  return (
    <Menu as="div" className="relative">
      <Menu.Button className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
        isScrolled 
          ? 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400' 
          : 'text-white hover:text-primary-200'
      }`}>
        <Cog6ToothIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Settings</span>
      </Menu.Button>
      
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-600 focus:outline-none">
          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
            No settings available
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default SettingsDropdown;