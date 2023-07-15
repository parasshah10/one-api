import React from 'react';
import { Segment, Header } from 'semantic-ui-react';

const NotFound = () => (
  <>
    <Header
      block
      as="h4"
      content="404"
      attached="top"
      icon="info"
      className="small-icon"
    />
    <Segment attached="bottom">
      The requested page was not found
    </Segment>
  </>
);

export default NotFound;
