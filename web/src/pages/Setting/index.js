import React from 'react';
import { Segment, Tab } from 'semantic-ui-react';
import SystemSetting from '../../components/SystemSetting';
import { isRoot } from '../../helpers';
import OtherSetting from '../../components/OtherSetting';
import PersonalSetting from '../../components/PersonalSetting';
import OperationSetting from '../../components/OperationSetting';

const Setting = () => {
  let panes = [
    {
      menuItem: 'Personal Settings',
      render: () => (
        <Tab.Pane attached={false}>
          <PersonalSetting />
        </Tab.Pane>
      )
    }
  ];

  if (isRoot()) {
    panes.push({
      menuItem: 'Operation Settings',
      render: () => (
        <Tab.Pane attached={false}>
          <OperationSetting />
        </Tab.Pane>
      )
    });
    panes.push({
      menuItem: 'System Settings',
      render: () => (
        <Tab.Pane attached={false}>
          <SystemSetting />
        </Tab.Pane>
      )
    });
    panes.push({
      menuItem: 'Other Settings',
      render: () => (
        <Tab.Pane attached={false}>
          <OtherSetting />
        </Tab.Pane>
      )
    });
  }

  return (
    <Segment>
      <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
    </Segment>
  );
};

export default Setting;
