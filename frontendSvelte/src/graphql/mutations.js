/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createTask = /* GraphQL */ `
  mutation CreateTask(
    $condition: ModelTaskConditionInput
    $input: CreateTaskInput!
  ) {
    createTask(condition: $condition, input: $input) {
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
export const deleteTask = /* GraphQL */ `
  mutation DeleteTask(
    $condition: ModelTaskConditionInput
    $input: DeleteTaskInput!
  ) {
    deleteTask(condition: $condition, input: $input) {
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
export const updateTask = /* GraphQL */ `
  mutation UpdateTask(
    $condition: ModelTaskConditionInput
    $input: UpdateTaskInput!
  ) {
    updateTask(condition: $condition, input: $input) {
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
