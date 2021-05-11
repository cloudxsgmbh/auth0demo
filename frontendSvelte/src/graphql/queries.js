/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getTask = /* GraphQL */ `
  query GetTask($id: ID!) {
    getTask(id: $id) {
      _deleted
      _lastChangedAt
      _version
      completed
      createdAt
      id
      name
      updatedAt
    }
  }
`;
export const listTasks = /* GraphQL */ `
  query ListTasks(
    $filter: ModelTaskFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTasks(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        _deleted
        _lastChangedAt
        _version
        completed
        createdAt
        id
        name
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
export const syncTasks = /* GraphQL */ `
  query SyncTasks(
    $filter: ModelTaskFilterInput
    $lastSync: AWSTimestamp
    $limit: Int
    $nextToken: String
  ) {
    syncTasks(
      filter: $filter
      lastSync: $lastSync
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        _deleted
        _lastChangedAt
        _version
        completed
        createdAt
        id
        name
        updatedAt
      }
      nextToken
      startedAt
    }
  }
`;
