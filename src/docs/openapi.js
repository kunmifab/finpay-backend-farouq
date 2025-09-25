const packageJson = require('../../package.json');

const apiVersion = packageJson.version || '1.0.0';

const standardResponse = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    success: { type: 'boolean' },
    status: { type: 'integer', format: 'int32' }
  },
  required: ['message', 'success', 'status']
};

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'Finpay Backend API',
    version: apiVersion,
    description: 'REST API for the Finpay backend powering authentication, wallets, cards, invoices and Maplerad webhooks.'
  },
  servers: [
    {
      url: '{scheme}://{host}:{port}',
      description: 'Primary server',
      variables: {
        scheme: {
          default: 'http',
          enum: ['http', 'https']
        },
        host: {
          default: 'localhost'
        },
        port: {
          default: '3000'
        }
      }
    }
  ],
  security: [
    {
      AuthToken: []
    }
  ],
  tags: [
    { name: 'Auth', description: 'User registration, login and email verification' },
    { name: 'Dashboard', description: 'Aggregated balances and rates' },
    { name: 'Invoices', description: 'Invoice management endpoints' },
    { name: 'Cards', description: 'Virtual card lifecycle management' },
    { name: 'Transactions', description: 'Wallet and payout transaction history' },
    { name: 'Wallets', description: 'Wallet balances, transfers and conversions' },
    { name: 'Webhooks', description: 'Inbound Maplerad webhook processing' }
  ],
  components: {
    securitySchemes: {
      AuthToken: {
        type: 'apiKey',
        in: 'header',
        name: 'x-auth-token',
        description: 'JWT created at login and required for authenticated /api routes.'
      }
    },
    schemas: {
      StandardResponse: standardResponse,
      ErrorResponse: {
        allOf: [
          { $ref: '#/components/schemas/StandardResponse' },
          {
            properties: {
              success: { const: false }
            }
          }
        ]
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: ['string', 'null'] },
          phone: { type: ['string', 'null'] },
          accountType: { type: ['string', 'null'] },
          countryCode: { type: ['string', 'null'] },
          state: { type: ['string', 'null'] },
          address: { type: ['string', 'null'] },
          country: { type: ['string', 'null'] }
        },
        required: ['id', 'email']
      },
      Balance: {
        type: 'object',
        properties: {
          currency: { type: 'string', minLength: 3, maxLength: 10 },
          amount: { type: 'number' }
        },
        required: ['currency', 'amount']
      },
      BalanceSummary: {
        type: 'object',
        properties: {
          usd: { type: 'number' },
          eur: { type: 'number' },
          ngn: { type: 'number' },
          gbp: { type: 'number' },
          total: { type: 'number' },
          currency: { type: 'string' }
        },
        required: ['usd', 'eur', 'ngn', 'gbp', 'total', 'currency']
      },
      Address: {
        type: 'object',
        properties: {
          street: { type: ['string', 'null'] },
          city: { type: ['string', 'null'] },
          state: { type: ['string', 'null'] },
          country: { type: ['string', 'null'] },
          postalCode: { type: ['string', 'null'] }
        }
      },
      Account: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          accountHolder: { type: ['string', 'null'] },
          bankName: { type: ['string', 'null'] },
          accountNumber: { type: ['string', 'null'] },
          routingNumber: { type: ['string', 'null'] },
          accountType: { type: ['string', 'null'] },
          currency: { type: 'string' },
          address: { $ref: '#/components/schemas/Address' }
        },
        required: ['id', 'currency']
      },
      ExchangeRateSummary: {
        type: 'object',
        properties: {
          currency: { type: 'string' },
          rates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                currency: { type: 'string' },
                buyPrice: { type: ['number', 'string', 'null'] },
                sellPrice: { type: ['number', 'string', 'null'] }
              },
              required: ['currency', 'buyPrice', 'sellPrice']
            }
          }
        },
        required: ['currency', 'rates']
      },
      InvoiceItemInput: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
          amount: { type: 'number', minimum: 0 }
        },
        required: ['description', 'quantity', 'amount']
      },
      InvoiceCustomerAddress: {
        type: 'object',
        properties: {
          country: { type: ['string', 'null'] },
          state: { type: ['string', 'null'] },
          address: { type: ['string', 'null'] }
        }
      },
      InvoiceCustomer: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          address: { $ref: '#/components/schemas/InvoiceCustomerAddress' }
        },
        required: ['name', 'email']
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          currency: { type: 'string' },
          issueDate: { type: 'string', format: 'date' },
          dueDate: { type: 'string', format: 'date' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'integer' },
                amount: { type: 'number' }
              },
              required: ['description', 'quantity', 'amount']
            }
          },
          customer: { $ref: '#/components/schemas/InvoiceCustomer' },
          sharableUrl: { type: ['string', 'null'], format: 'uri' }
        },
        required: ['id', 'currency', 'issueDate', 'dueDate', 'items', 'customer']
      },
      PaginatedInvoices: {
        type: 'object',
        allOf: [
          { $ref: '#/components/schemas/StandardResponse' },
          {
            properties: {
              totalFetched: { type: 'integer' },
              invoiceStatus: { type: 'string' },
              invoiceTotal: { type: 'integer' },
              page: { type: 'integer' },
              limit: { type: 'integer' },
              totalPages: { type: 'integer' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    currency: { type: 'string' },
                    issueDate: { type: ['string', 'null'], format: 'date' },
                    dueDate: { type: ['string', 'null'], format: 'date' },
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/InvoiceItemInput' }
                    },
                    customer: { $ref: '#/components/schemas/InvoiceCustomer' }
                  },
                  required: ['id', 'currency', 'items']
                }
              }
            }
          }
        ]
      },
      InvoiceSummary: {
        type: 'object',
        properties: {
          invoices: {
            type: 'object',
            properties: {
              due: { type: 'integer' },
              overdue: { type: 'integer' },
              pending: { type: 'integer' }
            },
            required: ['due', 'overdue', 'pending']
          }
        },
        required: ['invoices']
      },
      Card: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: ['string', 'null'] },
          holder_name: { type: ['string', 'null'] },
          reference: { type: ['string', 'null'] },
          card_reference: { type: ['string', 'null'] },
          currency: { type: ['string', 'null'] },
          type: { type: ['string', 'null'] },
          brand: { type: ['string', 'null'] },
          status: { type: ['string', 'null'] },
          cardNumber: { type: ['string', 'null'] },
          maskedPan: { type: ['string', 'null'] },
          expiry: { type: ['string', 'null'] },
          cvv: { type: ['string', 'null'] },
          balance: { type: ['number', 'null'] },
          balanceUpdatedAt: { type: ['string', 'null'], format: 'date-time' },
          autoApprove: { type: ['boolean', 'null'] },
          firstSix: { type: ['string', 'null'] },
          lastFour: { type: ['string', 'null'] },
          expiry_month: { type: ['string', 'null'] },
          expiry_year: { type: ['string', 'null'] },
          createdAt: { type: ['string', 'null'], format: 'date-time' },
          updatedAt: { type: ['string', 'null'], format: 'date-time' }
        },
        required: ['id']
      },
      WalletTransferRequest: {
        type: 'object',
        properties: {
          amount: { type: 'number', minimum: 0 },
          accountType: { type: 'string', enum: ['individual'] },
          currency: { type: 'string' },
          recievingCurrency: { type: 'string' },
          description: { type: ['string', 'null'] },
          agentPhoneNumber: { type: ['string', 'null'] },
          accountNumber: { type: 'string' },
          accountHolder: { type: 'string' },
          bankName: { type: 'string' },
          street: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          country: { type: 'string' },
          postalCode: { type: 'string' }
        },
        required: ['amount', 'accountType', 'currency', 'recievingCurrency', 'accountNumber', 'accountHolder', 'bankName', 'street', 'city', 'state', 'country', 'postalCode']
      },
      WalletTransferResponseData: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string' }
        },
        required: ['amount', 'currency']
      },
      WalletFundRequest: {
        type: 'object',
        properties: {
          amount: { type: 'number', minimum: 0 },
          currency: { type: 'string', enum: ['USD', 'NGN'] }
        },
        required: ['amount', 'currency']
      },
      ExpenseIncomeSummary: {
        type: 'object',
        properties: {
          expenses: { type: 'number' },
          income: { type: 'number' },
          currency: { type: 'string' }
        },
        required: ['expenses', 'income', 'currency']
      },
      CurrencyConversionRequest: {
        type: 'object',
        properties: {
          amount: { type: 'number', minimum: 0 },
          fromCurrency: { type: 'string' },
          toCurrency: { type: 'string' }
        },
        required: ['amount', 'fromCurrency', 'toCurrency']
      },
      CurrencyConversionResult: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string' },
          rate: { type: ['number', 'string'] }
        },
        required: ['amount', 'currency', 'rate']
      },
      TransactionRecord: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          receivingCurrency: { type: ['string', 'null'] },
          status: { type: ['string', 'null'] },
          amount: { type: 'number' },
          recipientName: { type: ['string', 'null'] },
          description: { type: ['string', 'null'] },
          type: { type: ['string', 'null'] },
          transactionDate: { type: ['string', 'null'], format: 'date' }
        },
        required: ['id', 'amount']
      },
      PaginatedTransactions: {
        type: 'object',
        allOf: [
          { $ref: '#/components/schemas/StandardResponse' },
          {
            properties: {
              totalFetched: { type: 'integer' },
              transactionStatus: { type: 'string' },
              transactionTotal: { type: 'integer' },
              page: { type: 'integer' },
              limit: { type: 'integer' },
              totalPages: { type: 'integer' },
              data: {
                type: 'array',
                items: { $ref: '#/components/schemas/TransactionRecord' }
              }
            }
          }
        ]
      },
      MapleradWebhookEnvelope: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          reference: { type: ['string', 'null'] },
          data: { type: 'object', additionalProperties: true }
        },
        required: ['event']
      }
    },
    responses: {
      BadRequest: {
        description: 'Client error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      Unauthorized: {
        description: 'Authentication required or token invalid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      ServerError: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    }
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user account',
        description: 'Creates a new user, sends an email verification code, issues default balances and returns an authentication token.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  name: { type: 'string' },
                  phoneNumber: { type: 'string' },
                  accountType: { type: 'string' },
                  countryCode: { type: ['string', 'null'] },
                  state: { type: ['string', 'null'] },
                  address: { type: ['string', 'null'] },
                  country: { type: ['string', 'null'] }
                },
                required: ['email', 'password', 'name', 'phoneNumber']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            token: { type: 'string' },
                            user: { $ref: '#/components/schemas/UserProfile' }
                          },
                          required: ['token', 'user']
                        }
                      },
                      required: ['data']
                    }
                  ]
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate a user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            token: { type: 'string' },
                            user: { $ref: '#/components/schemas/UserProfile' }
                          },
                          required: ['token', 'user']
                        }
                      },
                      required: ['data']
                    }
                  ]
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Invalidate the current token',
        description: 'Adds the provided token to an in-memory blacklist.',
        responses: {
          '200': {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Confirm the four digit email verification code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'integer', minimum: 1000, maximum: 9999 }
                },
                required: ['code']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Email verified successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/auth/password/reset': {
      post: {
        tags: ['Auth'],
        summary: 'Reset a user password',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  old_password: { type: 'string' },
                  new_password: { type: 'string', minLength: 6 }
                },
                required: ['email', 'old_password', 'new_password']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password reset',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/UserProfile' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/auth/send-verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Trigger email verification code delivery',
        responses: {
          '200': {
            description: 'Verification email sent',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/users/balances': {
      get: {
        tags: ['Dashboard'],
        summary: 'Fetch multi-currency balances for the user',
        responses: {
          '200': {
            description: 'Balances retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/BalanceSummary' }
                      },
                      required: ['data']
                    }
                  ]
                }
              }
            }
          },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/accounts': {
      get: {
        tags: ['Dashboard'],
        summary: 'List payout accounts for the user',
        responses: {
          '200': {
            description: 'Accounts retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Account' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/accounts/{id}': {
      get: {
        tags: ['Dashboard'],
        summary: 'Retrieve a single payout account by id',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Account retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Account' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/rates': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get cached exchange rates',
        responses: {
          '200': {
            description: 'Exchange rates retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/ExchangeRateSummary' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/invoices': {
      post: {
        tags: ['Invoices'],
        summary: 'Create a new invoice',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  currency: { type: 'string' },
                  issueDate: { type: 'string', format: 'date' },
                  dueDate: { type: 'string', format: 'date' },
                  items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/InvoiceItemInput' },
                    minItems: 1
                  },
                  customer: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      address: { $ref: '#/components/schemas/InvoiceCustomerAddress' }
                    },
                    required: ['name', 'email', 'address']
                  }
                },
                required: ['currency', 'issueDate', 'dueDate', 'items', 'customer']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Invoice created successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Invoice' }
                      },
                      required: ['data']
                    }
                  ]
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      },
      get: {
        tags: ['Invoices'],
        summary: 'List invoices with filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 }, description: 'Page number (default 1)' },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 }, description: 'Page size (default 10)' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['all', 'pending', 'due', 'overdue', 'paid'] }, description: 'Status filter' },
          { name: 'filter', in: 'query', schema: { type: 'string', format: 'date' }, description: 'ISO date used to filter by issue or due date' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Free-text search across items and customers' }
        ],
        responses: {
          '200': {
            description: 'Invoices retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedInvoices' }
              }
            }
          },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/invoices/{id}': {
      delete: {
        tags: ['Invoices'],
        summary: 'Delete an invoice by id',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Invoice deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/invoices/summary': {
      get: {
        tags: ['Invoices'],
        summary: 'Invoice counts grouped by status',
        responses: {
          '200': {
            description: 'Summary retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/InvoiceSummary' }
                      },
                      required: ['data']
                    }
                  ]
                }
              }
            }
          },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/cards': {
      post: {
        tags: ['Cards'],
        summary: 'Initiate virtual card creation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  currency: { type: 'string' },
                  brand: { type: 'string', default: 'VISA' },
                  walletId: { type: ['string', 'null'] },
                  fees: { type: ['number', 'null'] },
                  type: { type: 'string', default: 'VIRTUAL' }
                },
                required: ['currency']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Card provisioning started',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            currency: { type: ['string', 'null'] },
                            status: { type: ['string', 'null'] },
                            type: { type: ['string', 'null'] },
                            brand: { type: ['string', 'null'] },
                            reference: { type: ['string', 'null'] },
                            card_reference: { type: ['string', 'null'] }
                          },
                          required: ['id']
                        }
                      },
                      required: ['data']
                    }
                  ]
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      },
      get: {
        tags: ['Cards'],
        summary: 'List cards for the user',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 }, description: 'Page number (default 1)' },
          { name: 'page_size', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50 }, description: 'Page size (default 10)' },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 50 }, description: 'Optional limit overriding pagination' }
        ],
        responses: {
          '200': {
            description: 'Cards retrieved',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Card' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/cards/{id}': {
      get: {
        tags: ['Cards'],
        summary: 'Get card details by id',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Card retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Card' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      },
      delete: {
        tags: ['Cards'],
        summary: 'Soft delete a card and freeze it upstream',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Card deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/wallets/balance': {
      get: {
        tags: ['Wallets'],
        summary: 'Retrieve user balance for a currency',
        parameters: [
          { name: 'currency', in: 'query', schema: { type: 'string', default: 'USD' }, description: 'Currency code to look up' }
        ],
        responses: {
          '201': {
            description: 'Balance retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/Balance' }
                      },
                      required: ['data']
                    }
                  ]
                }
              }
            }
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/wallets/accounts': {
      get: {
        tags: ['Wallets'],
        summary: 'Fetch wallet-linked bank accounts',
        parameters: [
          { name: 'currency', in: 'query', schema: { type: 'string', default: 'USD' } }
        ],
        responses: {
          '201': {
            description: 'Accounts retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              accountHolder: { type: 'string' },
                              bankName: { type: 'string' },
                              accountNumber: { type: 'string' },
                              routingNumber: { type: ['string', 'null'] },
                              accountType: { type: ['string', 'null'] },
                              currency: { type: 'string' }
                            },
                            required: ['id', 'accountHolder', 'bankName', 'accountNumber', 'currency']
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/wallets/send': {
      post: {
        tags: ['Wallets'],
        summary: 'Send money to an external beneficiary',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WalletTransferRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Transfer initiated',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/WalletTransferResponseData' }
                      },
                      required: ['data']
                    }
                  ]
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/wallets/withdraw': {
      post: {
        tags: ['Wallets'],
        summary: 'Withdraw funds to a linked account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'number', minimum: 0 },
                  currency: { type: 'string' },
                  recievingCurrency: { type: 'string' },
                  accountNumber: { type: 'string' },
                  accountHolder: { type: 'string' },
                  bankName: { type: 'string' }
                },
                required: ['amount', 'currency', 'recievingCurrency', 'accountNumber', 'accountHolder', 'bankName']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Withdrawal initiated',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/WalletTransferResponseData' }
                      },
                      required: ['data']
                    }
                  ]
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/wallets/fund': {
      post: {
        tags: ['Wallets'],
        summary: 'Top up wallet balance (sandbox)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WalletFundRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Wallet funded successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/WalletTransferResponseData' }
                      },
                      required: ['data']
                    }
                  ]
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/wallets/expenses-income': {
      get: {
        tags: ['Wallets'],
        summary: 'Aggregate expenses and income by currency',
        parameters: [
          { name: 'currency', in: 'query', schema: { type: 'string', default: 'USD' } }
        ],
        responses: {
          '201': {
            description: 'Aggregated totals retrieved',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/ExpenseIncomeSummary' }
                      },
                      required: ['data']
                    }
                  ]
                }
              }
            }
          },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/wallets/convert': {
      post: {
        tags: ['Wallets'],
        summary: 'Convert funds between currencies',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CurrencyConversionRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Conversion completed',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/CurrencyConversionResult' }
                      },
                      required: ['data']
                    }
                  ]
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    },
    '/api/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'List transactions with filters',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 }, description: 'Page number (default 1)' },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 }, description: 'Page size (default 10)' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['all', 'pending', 'successful', 'failed', 'due', 'overdue'] }, description: 'Status filter' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term applied to name, description, reference, currency or type' },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'ISO start date filter applied to createdAt' },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'ISO end date filter applied to createdAt' }
        ],
        responses: {
          '200': {
            description: 'Transactions retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedTransactions' }
              }
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/ServerError' }
        },
      },
    },
    '/api/transactions/{id}': {
      get: {
        tags: ['Transactions'],
        summary: 'Fetch a single transaction by id',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Transaction retrieved',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/StandardResponse' },
                    {
                      properties: {
                        data: { $ref: '#/components/schemas/TransactionRecord' }
                      }
                    },
                  ],
                },
              }
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/ServerError' }
        },
      },
    },
    '/webhooks/maplerad': {
      post: {
        tags: ['Webhooks'],
        summary: 'Handle SVIX-signed Maplerad webhooks',
        description: 'Validates Svix headers, verifies signatures and fans out to internal processors for issuing and virtual account events.',
        security: [],
        requestBody: {
          description: 'Raw webhook payload as delivered by Maplerad (Svix).',
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MapleradWebhookEnvelope' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Webhook accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/ServerError' }
        }
      }
    }
  }
};

module.exports = spec;
