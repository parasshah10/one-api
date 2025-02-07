import React, { useEffect, useState } from 'react';
import { Button, Form, Header, Label, Pagination, Segment, Select, Table } from 'semantic-ui-react';
import { API, isAdmin, showError, timestamp2string } from '../helpers';

import { ITEMS_PER_PAGE } from '../constants';
import { renderQuota } from '../helpers/render';

function renderTimestamp(timestamp) {
  return (
    <>
      {timestamp2string(timestamp)}
    </>
  );
}

const MODE_OPTIONS = [
  { key: 'all', text: 'All Users', value: 'all' },
  { key: 'self', text: 'Current user', value: 'self' }
];

const LOG_OPTIONS = [
  { key: '0', text: 'All', value: 0 },
  { key: '1', text: 'Recharge', value: 1 },
  { key: '2', text: 'Consumption', value: 2 },
  { key: '3', text: 'Manage', value: 3 },
  { key: '4', text: 'System', value: 4 }
];

function renderType(type) {
  switch (type) {
    case 1:
      return <Label basic color='green'> Recharge </Label>;
    case 2:
      return <Label basic color='olive'> Consumption </Label>;
    case 3:
      return <Label basic color='orange'> Manage </Label>;
    case 4:
      return <Label basic color='purple'> System </Label>;
    default:
      return <Label basic color='black'> Unknown </Label>;
  }
}

const LogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [logType, setLogType] = useState(0);
  const isAdminUser = isAdmin();
  let now = new Date();
  const [inputs, setInputs] = useState({
    username: '',
    token_name: '',
    model_name: '',
    start_timestamp: timestamp2string(0),
    end_timestamp: timestamp2string(now.getTime() / 1000 + 3600)
  });
  const { username, token_name, model_name, start_timestamp, end_timestamp } = inputs;

  const [stat, setStat] = useState({
    quota: 0,
    token: 0
  });

  const handleInputChange = (e, { name, value }) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const getLogSelfStat = async () => {
    let localStartTimestamp = Date.parse(start_timestamp) / 1000;
    let localEndTimestamp = Date.parse(end_timestamp) / 1000;
    let res = await API.get(`/api/log/self/stat?type=${logType}&token_name=${token_name}&model_name=${model_name}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`);
    const { success, message, data } = res.data;
    if (success) {
      setStat(data);
    } else {
      showError(message);
    }
  };

  const getLogStat = async () => {
    let localStartTimestamp = Date.parse(start_timestamp) / 1000;
    let localEndTimestamp = Date.parse(end_timestamp) / 1000;
    let res = await API.get(`/api/log/stat?type=${logType}&username=${username}&token_name=${token_name}&model_name=${model_name}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`);
    const { success, message, data } = res.data;
    if (success) {
      setStat(data);
    } else {
      showError(message);
    }
  };

  const loadLogs = async (startIdx) => {
    let url = '';
    let localStartTimestamp = Date.parse(start_timestamp) / 1000;
    let localEndTimestamp = Date.parse(end_timestamp) / 1000;
    if (isAdminUser) {
      url = `/api/log/?p=${startIdx}&type=${logType}&username=${username}&token_name=${token_name}&model_name=${model_name}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`;
    } else {
      url = `/api/log/self/?p=${startIdx}&type=${logType}&token_name=${token_name}&model_name=${model_name}&start_timestamp=${localStartTimestamp}&end_timestamp=${localEndTimestamp}`;
    }
    const res = await API.get(url);
    const { success, message, data } = res.data;
    if (success) {
      if (startIdx === 0) {
        setLogs(data);
      } else {
        let newLogs = [...logs];
        newLogs.splice(startIdx * ITEMS_PER_PAGE, data.length, ...data);
        setLogs(newLogs);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const onPaginationChange = (e, { activePage }) => {
    (async () => {
      if (activePage === Math.ceil(logs.length / ITEMS_PER_PAGE) + 1) {
        // In this case we have to load more data and then append them.
        await loadLogs(activePage - 1);
      }
      setActivePage(activePage);
    })();
  };

  const refresh = async () => {
    setLoading(true);
    setActivePage(1)
    await loadLogs(0);
    if (isAdminUser) {
      getLogStat().then();
    } else {
      getLogSelfStat().then();
    }
  };

  useEffect(() => {
    refresh().then();
  }, [logType]);

  const searchLogs = async () => {
    if (searchKeyword === '') {
      // if keyword is blank, load files instead.
      await loadLogs(0);
      setActivePage(1);
      return;
    }
    setSearching(true);
    const res = await API.get(`/api/log/self/search?keyword=${searchKeyword}`);
    const { success, message, data } = res.data;
    if (success) {
      setLogs(data);
      setActivePage(1);
    } else {
      showError(message);
    }
    setSearching(false);
  };

  const handleKeywordChange = async (e, { value }) => {
    setSearchKeyword(value.trim());
  };

  const sortLog = (key) => {
    if (logs.length === 0) return;
    setLoading(true);
    let sortedLogs = [...logs];
    if (typeof sortedLogs[0][key] === 'string'){
      sortedLogs.sort((a, b) => {
        return ('' + a[key]).localeCompare(b[key]);
      });
    } else {
      sortedLogs.sort((a, b) => {
        if (a[key] === b[key]) return 0;
        if (a[key] > b[key]) return -1;
        if (a[key] < b[key]) return 1;
      });
    }
    if (sortedLogs[0].id === logs[0].id) {
      sortedLogs.reverse();
    }
    setLogs(sortedLogs);
    setLoading(false);
  };

  return (
    <>
      <Segment>
        <Header as='h3'>Usage Details（Total Consumption：{renderQuota(stat.quota)}）</Header>
        <Form>
          <Form.Group>
            {
              isAdminUser && (
                <Form.Input fluid label={'User Name'} width={2} value={username}
                            placeholder={'optional value'} name='username'
                            onChange={handleInputChange} />
              )
            }
            <Form.Input fluid label={'Token Name'} width={isAdminUser ? 2 : 3} value={token_name}
                        placeholder={'optional value'} name='token_name' onChange={handleInputChange} />
            <Form.Input fluid label='Model Name' width={isAdminUser ? 2 : 3} value={model_name} placeholder='optional value'
                        name='model_name'
                        onChange={handleInputChange} />
            <Form.Input fluid label='Start Time' width={4} value={start_timestamp} type='datetime-local'
                        name='start_timestamp'
                        onChange={handleInputChange} />
            <Form.Input fluid label='End Time' width={4} value={end_timestamp} type='datetime-local'
                        name='end_timestamp'
                        onChange={handleInputChange} />
            <Form.Button fluid label='Operate' width={2} onClick={refresh}>Inquire</Form.Button>
          </Form.Group>
        </Form>
        <Table basic compact size='small'>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('created_time');
                }}
                width={3}
              >
                Time
              </Table.HeaderCell>
              {
                isAdminUser && <Table.HeaderCell
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    sortLog('username');
                  }}
                  width={1}
                >
                  User
                </Table.HeaderCell>
              }
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('token_name');
                }}
                width={1}
              >
                Token
              </Table.HeaderCell>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('type');
                }}
                width={1}
              >
                Type
              </Table.HeaderCell>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('model_name');
                }}
                width={2}
              >
                Model
              </Table.HeaderCell>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('prompt_tokens');
                }}
                width={1}
              >
                Prompt
              </Table.HeaderCell>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('completion_tokens');
                }}
                width={1}
              >
                Completion
              </Table.HeaderCell>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('quota');
                }}
                width={2}
              >
                Consumption Quota
              </Table.HeaderCell>
              <Table.HeaderCell
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  sortLog('content');
                }}
                width={isAdminUser ? 4 : 5}
              >
                Details
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {logs
              .slice(
                (activePage - 1) * ITEMS_PER_PAGE,
                activePage * ITEMS_PER_PAGE
              )
              .map((log, idx) => {
                if (log.deleted) return <></>;
                return (
                  <Table.Row key={log.created_at}>
                    <Table.Cell>{renderTimestamp(log.created_at)}</Table.Cell>
                    {
                      isAdminUser && (
                        <Table.Cell>{log.username ? <Label>{log.username}</Label> : ''}</Table.Cell>
                      )
                    }
                    <Table.Cell>{log.token_name ? <Label basic>{log.token_name}</Label> : ''}</Table.Cell>
                    <Table.Cell>{renderType(log.type)}</Table.Cell>
                    <Table.Cell>{log.model_name ? <Label basic>{log.model_name}</Label> : ''}</Table.Cell>
                    <Table.Cell>{log.prompt_tokens ? log.prompt_tokens : ''}</Table.Cell>
                    <Table.Cell>{log.completion_tokens ? log.completion_tokens : ''}</Table.Cell>
                    <Table.Cell>{log.quota ? renderQuota(log.quota, 6) : ''}</Table.Cell>
                    <Table.Cell>{log.content}</Table.Cell>
                  </Table.Row>
                );
              })}
          </Table.Body>

          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell colSpan={'9'}>
                <Select
                  placeholder='Select a detailed category'
                  options={LOG_OPTIONS}
                  style={{ marginRight: '8px' }}
                  name='logType'
                  value={logType}
                  onChange={(e, { name, value }) => {
                    setLogType(value);
                  }}
                />
                <Button size='small' onClick={refresh} loading={loading}>Refresh</Button>
                <Pagination
                  floated='right'
                  activePage={activePage}
                  onPageChange={onPaginationChange}
                  size='small'
                  siblingRange={1}
                  totalPages={
                    Math.ceil(logs.length / ITEMS_PER_PAGE) +
                    (logs.length % ITEMS_PER_PAGE === 0 ? 1 : 0)
                  }
                />
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        </Table>
      </Segment>
    </>
  );
};

export default LogsTable;
