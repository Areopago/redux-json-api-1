import { createAction } from 'redux-actions';

import {
  makeUpdateReverseRelationship,
  setIsInvalidatingForExistingResource,
  updateOrInsertResource,
  updateOrInsertResourcesIntoState,
  ensureResourceTypeInState,
  ensureRelationshipInState,
  updateRelationship,
  setIsInvalidatingForExistingRelationship
} from '../src/state-mutation';

import {
  reducer,
  IS_UPDATING
} from '../src/jsonapi';

import {
  apiState,
  patchedResource
} from './payloads/failingReverseRelationshipUpdate';

import topics from './payloads/topics.json';

const resource = {
  type: 'tasks',
  id: '43',
  attributes: {
    name: 'ABC',
    createdAt: '2016-02-19T11:52:43+0000',
    updatedAt: '2016-02-19T11:52:43+0000'
  },
  relationships: {
    taskList: {
      data: {
        type: 'taskLists',
        id: '1'
      }
    },
    transaction: {
      data: {
        type: 'transactions',
        id: '35'
      }
    }
  },
  links: {
    self: 'http://localhost/tasks/43'
  }
};
const state = {
  endpoint: {
    host: null,
    path: null,
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json'
    }
  },
  users: {
    data: [
      {
        type: 'users',
        id: '1',
        attributes: {
          name: 'John Doe'
        },
        relationships: {
          companies: {
            data: null
          }
        }
      },
      {
        type: 'users',
        id: '2',
        attributes: {
          name: 'Emily Jane'
        },
        relationships: {
          companies: {
            data: null
          }
        }
      }
    ]
  },
  transactions: {
    data: [
      {
        type: 'transactions',
        id: '35',
        attributes: {
          description: 'ABC',
          createdAt: '2016-02-12T13:34:01+0000',
          updatedAt: '2016-02-19T11:52:43+0000',
        },
        relationships: {
          task: {
            data: null
          }
        },
        links: {
          self: 'http://localhost/transactions/34'
        }
      }, {
        type: 'transactions',
        id: '36',
        attributes: {
          description: 'ABC',
          createdAt: '2016-02-12T13:34:01+0000',
          updatedAt: '2016-02-19T11:52:43+0000',
        },
        relationships: {
          task: {
            data: null
          }
        },
        links: {
          self: 'http://localhost/transactions/34'
        }
      },
      {
        type: 'transactions',
        id: '37',
        attributes: {
          description: 'ABC',
          createdAt: '2016-02-12T13:34:01+0000',
          updatedAt: '2016-02-19T11:52:43+0000',
        },
        relationships: {
          task: {
            data: {
              type: 'tasks',
              id: '43'
            }
          }
        },
        links: {
          self: 'http://localhost/transactions/34'
        }
      }
    ]
  },
  isCreating: 0,
  isReading: 0,
  isUpdating: 0,
  isDeleting: 0
};

describe('[State mutation] Insertion of resources', () => {
  it('should read and insert all resources into state', () => {
    const updatedState = updateOrInsertResourcesIntoState(
      state, topics.data
    );

    expect(updatedState.topics.data.length).toEqual(topics.data.length);
  });

  it('should work when resource exists and data has no relationships', () => {
    const payload = {
      data: [
        {
          type: 'users',
          id: '1',
          attributes: {
            some: 'attribute',
          },
        }
      ],
    };
    expect(() => updateOrInsertResourcesIntoState(
      state, payload.data
    )).not.toThrow();
  });

  it('should persists existing relationships when response has none', () => {
    const payload = {
      data: [
        {
          type: 'users',
          id: '1',
          attributes: {
            some: 'attribute',
          },
        }
      ],
    };

    const updatedState = updateOrInsertResourcesIntoState(
      state, payload.data
    );

    expect(updatedState.users.data[0].relationships).toEqual(
      state.users.data[0].relationships
    );
  });
});

describe('[State mutation] Insertion of empty resources type', () => {
  it('should insert empty resources type into state', () => {
    const resourcesType = 'newResourcesType';
    const updatedState = ensureResourceTypeInState(
      state, resourcesType
    );

    expect(updatedState[resourcesType].data.length).toEqual(0);
  });

  it('should not mutate state if resources type exists', () => {
    const resourcesType = 'users';
    const updatedState = ensureResourceTypeInState(
      state, resourcesType
    );

    expect(updatedState[resourcesType].data).toEqual(state[resourcesType].data);
  });
});

describe('[State mutation] Insertion of empty relationship type', () => {
  it('should insert empty relationship into state resource', () => {
    const resourceIdentifier = {
      type: 'users',
      id: '1'
    };
    const updatedState = ensureRelationshipInState(
      state, resourceIdentifier, 'tasks'
    );

    expect(updatedState.users.data[0].relationships.tasks)
      .toBeNull();
  });

  it('should not mutate state if relationship exists', () => {
    const resourceIdentifier = {
      type: 'transactions',
      id: '37'
    };
    const updatedState = ensureResourceTypeInState(
      state, resourceIdentifier, 'task'
    );

    expect(updatedState.transactions.data[2].relationships.task)
      .toEqual(state.transactions.data[2].relationships.task);
  });
});

describe('[State Mutation] Update or Reverse relationships', () => {
  it('Should update a resource relationship', () => {
    const updatedEntities = makeUpdateReverseRelationship(
      resource,
      resource.relationships.transaction
    )(state.transactions.data);

    expect(updatedEntities[0].relationships.task.data)
      .toEqual({ id: resource.id, type: resource.type });
  });

  it('Should not mutate relationship, if new relationship is not null', () => {
    const localresource = {
      type: 'tasks',
      id: '43',
      attributes: {
        name: 'ABC',
        createdAt: '2016-02-19T11:52:43+0000',
        updatedAt: '2016-02-19T11:52:43+0000'
      },
      relationships: {
        taskList: {
          data: {
            type: 'taskLists',
            id: '1'
          }
        },
        transaction: {
          data: {
            type: 'transactions',
            id: '37'
          }
        }
      },
      links: {
        self: 'http://localhost/tasks/43'
      }
    };

    const updatedEnteties = makeUpdateReverseRelationship(
      localresource,
      localresource.relationships.transaction
    )(state.transactions.data);

    expect(updatedEnteties[2].relationships.task.data)
      .toBe(state.transactions.data[2].relationships.task.data);
  });

  it('Should nullify a resource relationship', () => {
    const updatedEnteties = makeUpdateReverseRelationship(
      resource,
      resource.relationships.transaction,
      null
    )(state.transactions.data);

    expect(updatedEnteties[0].relationships.task.data).toEqual(null);
  });

  it('should not duplicate existing reverse relationships', () => {
    const apiUpdated = createAction('API_UPDATED');
    const updatedState = reducer(apiState, apiUpdated(patchedResource));

    expect(
      updatedState.zenAccounts.data[0].relationships.expenseItems.data.length
    ).toEqual(1);
  });

  it('should correctly identifies and mutate one-to-many reverse relationship', () => {
    const localresource = {
      type: 'companies',
      id: '1',
      attributes: {
        name: 'ABC',
        createdAt: '2016-02-19T11:52:43+0000',
        updatedAt: '2016-02-19T11:52:43+0000'
      },
      relationships: {
        user: {
          data: {
            type: 'users',
            id: '1'
          }
        },
      },
      links: {
        self: 'http://localhost/companies/1'
      }
    };

    const updatedState = updateOrInsertResource(
      state,
      localresource
    );

    expect(updatedState.users.data[0].relationships.companies.data)
      .toStrictEqual([{ type: 'companies', id: '1' }]);
  });
});

describe('[State Mutation]: Set is invalidating for existing resource', () => {
  it('Should set a ivalidating type for resource to IS_UPDATING', () => {
    const { id, type } = state.users.data[0];
    const updatedState = setIsInvalidatingForExistingResource(
      state,
      { type, id },
      IS_UPDATING
    ).value();
    expect(updatedState.users.data[0].isInvalidating).toEqual(IS_UPDATING);
  });
});

describe('[State Mutation]: Set is invalidating for existing relationship', () => {
  it('Should set a isvalidating type for relationship to IS_UPDATING', () => {
    const { id, type } = state.users.data[0];
    const updatedState = setIsInvalidatingForExistingRelationship(
      state,
      {
        type,
        id
      },
      'companies',
      IS_UPDATING
    )
      .value();
    expect(updatedState.users.data[0].relationships.companies.isInvalidating)
      .toEqual(IS_UPDATING);
  });
});

describe('[State Mutation]: Create new reference when Object is mutated', () => {
  it('Should keep proper refrences when setting isInvalidating', () => {
    const { id, type } = state.users.data[0];
    const updatedState = setIsInvalidatingForExistingResource(
      state,
      { type, id },
      IS_UPDATING
    ).value();

    expect(updatedState.users.data[0]).not.toBe(state.users.data[0]);
    expect(updatedState.users.data[1]).toBe(state.users.data[1]);
  });

  it('Should keep proper refrences when updating reverse relationships', () => {
    const updatedResources = makeUpdateReverseRelationship(
      resource,
      resource.relationships.transaction
    )(state.transactions.data);

    expect(updatedResources[0]).not.toBe(state.transactions.data[0]);
    expect(updatedResources[1]).toBe(state.transactions.data[1]);
  });

  it('Should only replace updated resource', () => {
    const updatedState = updateOrInsertResource(state, {
      type: 'users',
      id: '1',
      attributes: {
        name: 'Mr. John Doe'
      },
      relationships: {
        companies: {
          data: null
        }
      }
    });

    expect(updatedState.users.data[0]).not.toBe(state.users.data[0]);
    expect(updatedState.users.data[1]).toBe(state.users.data[1]);
  });

  it('Should keep object reference on update or insert when resource hasn\'t changed', () => {
    const updatedState = updateOrInsertResource(state, {
      type: 'users',
      id: '1',
      attributes: {
        name: 'John Doe'
      },
      relationships: {
        companies: {
          data: null
        }
      }
    });

    expect(updatedState.users.data[0]).toBe(state.users.data[0]);
  });
});

describe('[State Mutation]: Update relationships', () => {
  it('should update a resource relationship', () => {
    const updatedState = updateRelationship(state, {
      type: 'users',
      id: '1'
    }, 'companies', {
      data: [
        {
          type: 'companies',
          id: '1'
        }
      ]
    });

    expect(updatedState.users.data[0].relationships.companies).toStrictEqual({
      data: [
        {
          type: 'companies',
          id: '1'
        }
      ]
    });
  });

  it('should clear a resource relationship', () => {
    const updatedState = updateRelationship(state, {
      type: 'users',
      id: '1'
    }, 'companies', {
      data: null
    });

    expect(updatedState.users.data[0].relationships.companies.data)
      .toBeNull();
  });
});
