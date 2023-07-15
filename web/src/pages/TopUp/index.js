import React, { useEffect, useState } from 'react';
import { Button, Form, Grid, Header, Segment, Statistic } from 'semantic-ui-react';
import { API, showError, showInfo, showSuccess } from '../../helpers';
import { renderQuota } from '../../helpers/render';

const TopUp = () => {
  const [redemptionCode, setRedemptionCode] = useState('');
  const [topUpLink, setTopUpLink] = useState('');
  const [userQuota, setUserQuota] = useState(0);

  const topUp = async () => {
    if (redemptionCode === '') {
      showInfo('Please enter the recharge code!')
      return;
    }
    const res = await API.post('/api/user/topup', {
      key: redemptionCode
    });
    const { success, message, data } = res.data;
    if (success) {
      showSuccess('Recharge successful!');
      setUserQuota((quota) => {
        return quota + data;
      });
      setRedemptionCode('');
    } else {
      showError(message);
    }
  };

  const openTopUpLink = () => {
    if (!topUpLink) {
      showError('The super administrator has not set a recharge link!');
      return;
    }
    window.open(topUpLink, '_blank');
  };

  const getUserQuota = async ()=>{
    let res  = await API.get(`/api/user/self`);
    const {success, message, data} = res.data;
    if (success) {
      setUserQuota(data.quota);
    } else {
      showError(message);
    }
  }

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      if (status.top_up_link) {
        setTopUpLink(status.top_up_link);
      }
    }
    getUserQuota().then();
  }, []);

  return (
    <Segment>
      <Header as='h3'>Recharge Amount</Header>
      <Grid columns={2} stackable>
        <Grid.Column>
          <Form>
            <Form.Input
              placeholder='Redemption Code'
              name='redemptionCode'
              value={redemptionCode}
              onChange={(e) => {
                setRedemptionCode(e.target.value);
              }}
            />
            <Button color='green' onClick={openTopUpLink}>
              Get redemption code
            </Button>
            <Button color='yellow' onClick={topUp}>
              Recharge
            </Button>
          </Form>
        </Grid.Column>
        <Grid.Column>
          <Statistic.Group widths='one'>
            <Statistic>
              <Statistic.Value>{renderQuota(userQuota)}</Statistic.Value>
              <Statistic.Label>Remaining Amount</Statistic.Label>
            </Statistic>
          </Statistic.Group>
        </Grid.Column>
      </Grid>
    </Segment>
  );
};


export default TopUp;
