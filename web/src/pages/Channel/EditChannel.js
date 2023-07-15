import React, { useEffect, useState } from 'react';
import { Button, Form, Header, Message, Segment } from 'semantic-ui-react';
import { useParams } from 'react-router-dom';
import { API, showError, showInfo, showSuccess, verifyJSON } from '../../helpers';
import { CHANNEL_OPTIONS } from '../../constants';

const MODEL_MAPPING_EXAMPLE = {
  'gpt-3.5-turbo-0301': 'gpt-3.5-turbo',
  'gpt-4-0314': 'gpt-4',
  'gpt-4-32k-0314': 'gpt-4-32k'
};

const EditChannel = () => {
  const params = useParams();
  const channelId = params.id;
  const isEdit = channelId !== undefined;
  const [loading, setLoading] = useState(isEdit);
  const originInputs = {
    name: '',
    type: 1,
    key: '',
    base_url: '',
    other: '',
    model_mapping: '',
    models: [],
    groups: ['default']
  };
  const [batch, setBatch] = useState(false);
  const [inputs, setInputs] = useState(originInputs);
  const [modelOptions, setModelOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [basicModels, setBasicModels] = useState([]);
  const [fullModels, setFullModels] = useState([]);
  const handleInputChange = (e, { name, value }) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const loadChannel = async () => {
    let res = await API.get(`/api/channel/${channelId}`);
    const { success, message, data } = res.data;
    if (success) {
      if (data.models === '') {
        data.models = [];
      } else {
        data.models = data.models.split(',');
      }
      if (data.group === '') {
        data.groups = [];
      } else {
        data.groups = data.group.split(',');
      }
      if (data.model_mapping !== '') {
        data.model_mapping = JSON.stringify(JSON.parse(data.model_mapping), null, 2);
      }
      setInputs(data);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const fetchModels = async () => {
    try {
      let res = await API.get(`/api/channel/models`);
      setModelOptions(res.data.data.map((model) => ({
        key: model.id,
        text: model.id,
        value: model.id
      })));
      setFullModels(res.data.data.map((model) => model.id));
      setBasicModels(res.data.data.filter((model) => !model.id.startsWith('gpt-4')).map((model) => model.id));
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      setGroupOptions(res.data.data.map((group) => ({
        key: group,
        text: group,
        value: group
      })));
    } catch (error) {
      showError(error.message);
    }
  };

  useEffect(() => {
    if (isEdit) {
      loadChannel().then();
    }
    fetchModels().then();
    fetchGroups().then();
  }, []);

  const submit = async () => {
    if (!isEdit && (inputs.name === '' || inputs.key === '')) {
      showInfo('Please fill in the channel name and channel key!');
      return;
    }
    if (inputs.models.length === 0) {
      showInfo('Please select at least one model!');
      return;
    }
    if (inputs.model_mapping !== '' && !verifyJSON(inputs.model_mapping)) {
      showInfo('Model mappings must be in valid JSON format!');
      return;
    }
    let localInputs = inputs;
    if (localInputs.base_url.endsWith('/')) {
      localInputs.base_url = localInputs.base_url.slice(0, localInputs.base_url.length - 1);
    }
    if (localInputs.type === 3 && localInputs.other === '') {
      localInputs.other = '2023-03-15-preview';
    }
    let res;
    localInputs.models = localInputs.models.join(',');
    localInputs.group = localInputs.groups.join(',');
    if (isEdit) {
      res = await API.put(`/api/channel/`, { ...localInputs, id: parseInt(channelId) });
    } else {
      res = await API.post(`/api/channel/`, localInputs);
    }
    const { success, message } = res.data;
    if (success) {
      if (isEdit) {
        showSuccess('Channel updated successfully!');
      } else {
        showSuccess('Channel created successfully!');
        setInputs(originInputs);
      }
    } else {
      showError(message);
    }
  };

  return (
    <>
      <Segment loading={loading}>
        <Header as='h3'>{isEdit ? 'Update channel information' : 'Create New Channel'}</Header>
        <Form autoComplete='new-password'>
          <Form.Field>
            <Form.Select
              label='Type'
              name='type'
              required
              options={CHANNEL_OPTIONS}
              value={inputs.type}
              onChange={handleInputChange}
            />
          </Form.Field>
          {
            inputs.type === 3 && (
              <>
                <Message>
                  注意，<strong>模型部署名称必须和模型名称保持一致</strong>，因为 One API 会把请求体中的 model
                  参数替换为你的部署名称（模型名称中的点会被剔除），<a target='_blank'
                                                                    href='https://github.com/songquanpeng/one-api/issues/133?notification_referrer_id=NT_kwDOAmJSYrM2NjIwMzI3NDgyOjM5OTk4MDUw#issuecomment-1571602271'>图片演示</a>。
                </Message>
                <Form.Field>
                  <Form.Input
                    label='AZURE_OPENAI_ENDPOINT'
                    name='base_url'
                    placeholder={'please enter AZURE_OPENAI_ENDPOINT，例如：https://docs-test-001.openai.azure.com'}
                    onChange={handleInputChange}
                    value={inputs.base_url}
                    autoComplete='new-password'
                  />
                </Form.Field>
                <Form.Field>
                  <Form.Input
                    label='Default API version'
                    name='other'
                    placeholder={'Please enter the default API version, for example: 2023-03-15-preview, this configuration can be overridden by actual request query parameters'}
                    onChange={handleInputChange}
                    value={inputs.other}
                    autoComplete='new-password'
                  />
                </Form.Field>
              </>
            )
          }
          {
            inputs.type === 8 && (
              <Form.Field>
                <Form.Input
                  label='Base URL'
                  name='base_url'
                  placeholder={'Please enter the Base URL of the custom channel, for example: https://openai.justsong.cn'}
                  onChange={handleInputChange}
                  value={inputs.base_url}
                  autoComplete='new-password'
                />
              </Form.Field>
            )
          }
          {
            inputs.type !== 3 && inputs.type !== 8 && (
              <Form.Field>
                <Form.Input
                  label='mirror image'
                  name='base_url'
                  placeholder={'This option is optional, enter the address of the mirror site in the format: https://domain.com'}
                  onChange={handleInputChange}
                  value={inputs.base_url}
                  autoComplete='new-password'
                />
              </Form.Field>
            )
          }
          <Form.Field>
            <Form.Input
              label='Name'
              required
              name='name'
              placeholder={'please enter a name'}
              onChange={handleInputChange}
              value={inputs.name}
              autoComplete='new-password'
            />
          </Form.Field>
          <Form.Field>
            <Form.Dropdown
              label='Group'
              placeholder={'Please select a group'}
              name='groups'
              required
              fluid
              multiple
              selection
              allowAdditions
              additionLabel={'Please edit the group override on the system settings page to add a new group:'}
              onChange={handleInputChange}
              value={inputs.groups}
              autoComplete='new-password'
              options={groupOptions}
            />
          </Form.Field>
          <Form.Field>
            <Form.Dropdown
              label='Model'
              placeholder={'Please select the model supported by this channel'}
              name='models'
              required
              fluid
              multiple
              selection
              onChange={handleInputChange}
              value={inputs.models}
              autoComplete='new-password'
              options={modelOptions}
            />
          </Form.Field>
          <div style={{ lineHeight: '40px', marginBottom: '12px' }}>
            <Button type={'button'} onClick={() => {
              handleInputChange(null, { name: 'models', value: basicModels });
            }}>Fill in the base model</Button>
            <Button type={'button'} onClick={() => {
              handleInputChange(null, { name: 'models', value: fullModels });
            }}>Fill in all models</Button>
            <Button type={'button'} onClick={() => {
              handleInputChange(null, { name: 'models', value: [] });
            }}>Clear All Models</Button>
          </div>
          <Form.Field>
            <Form.TextArea
              label='Model Mapping'
              placeholder={`This is optional, it is a JSON text, the key is the name of the model requested by the user, and the value is the name of the model to be replaced, for example：\n${JSON.stringify(MODEL_MAPPING_EXAMPLE, null, 2)}`}
              name='model_mapping'
              onChange={handleInputChange}
              value={inputs.model_mapping}
              style={{ minHeight: 150, fontFamily: 'JetBrains Mono, Consolas' }}
              autoComplete='new-password'
            />
          </Form.Field>
          {
            batch ? <Form.Field>
              <Form.TextArea
                label='Key'
                name='key'
                required
                placeholder={'Please enter the key, one per line'}
                onChange={handleInputChange}
                value={inputs.key}
                style={{ minHeight: 150, fontFamily: 'JetBrains Mono, Consolas' }}
                autoComplete='new-password'
              />
            </Form.Field> : <Form.Field>
              <Form.Input
                label='Key'
                name='key'
                required
                placeholder={'please enter key'}
                onChange={handleInputChange}
                value={inputs.key}
                autoComplete='new-password'
              />
            </Form.Field>
          }
          {
            !isEdit && (
              <Form.Checkbox
                checked={batch}
                label='Batch creation'
                name='batch'
                onChange={() => setBatch(!batch)}
              />
            )
          }
          <Button positive onClick={submit}>Submit</Button>
        </Form>
      </Segment>
    </>
  );
};

export default EditChannel;
