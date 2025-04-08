import React from 'react';
import { Tabs as AntTabs } from 'antd';
import cn from 'classnames';

const { TabPane } = AntTabs;

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

interface TabsListProps {
  className?: string;
  children?: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

interface TabsContentProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ 
  value, 
  onValueChange, 
  className,
  children 
}) => {
  return (
    <AntTabs
      activeKey={value}
      onChange={onValueChange}
      className={cn('w-full', className)}
    >
      {children}
    </AntTabs>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ className, children }) => {
  return (
    <div className={cn('flex space-x-2 rounded-lg p-1', className)}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className, children }) => {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        className
      )}
      data-value={value}
    >
      {children}
    </div>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({ value, className, children }) => {
  return (
    <TabPane
      key={value}
      tab={value}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
    </TabPane>
  );
};
