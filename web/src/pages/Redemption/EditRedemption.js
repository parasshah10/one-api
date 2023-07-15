import React, { useEffect, useState } from 'react';
import { Button, Form, Header, Segment } from 'semantic-ui-react';
import { useParams } from 'react-router-dom';
import { API, downloadTextAsFile, showError, showSuccess } from '../../helpers';
import { renderQuota, renderQuotaWithPrompt } from '../../helpers/render';

const EditRedemption = () => {
  const params = useParams();
  const redemptionId = params.id;
  const isEdit = redemptionId !== undefined;
  const [loading, setLoading] = useState(isEdit);
  const originInputs = {
    name: '',
    quota: 100000,
    count: 1
  };
  const [inputs, setInputs] = useState(originInputs);
  const { name, quota, count } = inputs;

  const handleInputChange = (e, { name, value }) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const loadRedemption = async () => {
    let res = await API.get(`/api/redemption/${redemptionId}`);
    const { success, message, data } = res.data;
    if (success) {
      setInputs(data);
    } else {
      showError(message);
    }
    setLoading(false);
  };
  useEffect(() => {
    if (isEdit) {
      loadRedemption().then();
    }
  }, []);

  const submit = async () => {
    if (!isEdit && inputs.name === '') return;
    let localInputs = inputs;
    localInputs.count = parseInt(localInputs.count);
    localInputs.quota = parseInt(localInputs.quota);
    let res;
    if (isEdit) {
      res = await API.put(`/api/redemption/`, { ...localInputs, id: parseInt(redemptionId) });
    } else {
      res = await API.post(`/api/redemption/`, {
        ...localInputs
      });
    }
    const { success, message, data } = res.data;
    if (success) {
      if (isEdit) {
        showSuccess('Redemption code updated successfully!');
      } else {
        showSuccess('Redemption code created successfully!');
        setInputs(originInputs);
      }
    } else {
      showError(message);
    }
    if (!isEdit && data) {
      let text = "";
      for (let i = 0; i < data.length; i++) {
        text += data[i] + "\n";
      }
      downloadTextAsFile(text, `${inputs.name}.txt`);
    }
  };

  return (
    <>
      <Segment loading={loading}>
        <Header as='h3'>{isEdit ? 'Update redemption code information' : 'Create a new redemption code'}</Header>
        <Form autoComplete='new-password'>
          <Form.Field>
            <Form.Input
              label='Name'
              name='name'
              placeholder={'please enter a name'}
              onChange={handleInputChange}
              value={name}
              autoComplete='new-password'
              required={!isEdit}
            />
          </Form.Field>
          <Form.Field>
            <Form.Input
              label={`Quota${renderQuotaWithPrompt(quota)}`}
              name='quota'
              placeholder={'Please enter the amount contained in a single redemption code'}
              onChange={handleInputChange}
              value={quota}
              autoComplete='new-password'
              type='number'
            />
          </Form.Field>
          {
            !isEdit && <>
              <Form.Field>
                <Form.Input
                  label='Generation quantity'
                  name='count'
                  placeholder={'Please enter the production quantity'}
                  onChange={handleInputChange}
                  value={count}
                  autoComplete='new-password'
                  type='number'
                />
              </Form.Field>
            </>
          }
          <Button positive onClick={submit}>Sumbit</Button>
        </Form>
      </Segment>
    </>
  );
};

export default EditRedemption;
