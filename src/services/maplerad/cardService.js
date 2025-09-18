const { mapleradAxios } = require("../../utils/mapleradClient");

async function createCard(data) {
  const res = await mapleradAxios.post('issuing', data, {
    headers: { 
        accept: 'application/json', 
        'content-type': 'application/json'
     },
  });
  return res.data ?? null;
}

async function getCards(data) {
  const { page_size = 10, page = 1, created_at = null, brand = 'VISA', status = 'ACTIVE', customerId = null } = data;
  const params = {
    page_size,
    page,
    created_at,
    brand,
    status,
    customerId
  };
  const res = await mapleradAxios.get('issuing', {
    params,
    headers: { 
        accept: 'application/json', 
        'content-type': 'application/json'
     },
  });
  return res.data ?? null;
}

async function getCard(data) {
  const { card_id } = data;
  try {
    const res = await mapleradAxios.get(`issuing/${card_id}`, {
      headers: { 
          accept: 'application/json', 
          'content-type': 'application/json'
      },
    });
    return res.data ?? null;
  } catch (error) {
    console.log(error);
    return null;
  }
 
}

async function freezeCard(data) {
  const { card_id } = data;
  const res = await mapleradAxios.patch(`issuing/${card_id}/freeze`, {
    headers: { 
        accept: 'application/json', 
        'content-type': 'application/json'
     },
  });
  return res.data ?? null;
}

async function unfreezeCard(data) {
  const { card_id } = data;
  const res = await mapleradAxios.patch(`issuing/${card_id}/unfreeze`, {
    card_id
  }, {
    headers: { 
        accept: 'application/json', 
        'content-type': 'application/json'
     },
  });
  return res.data ?? null;
}

async function getCardTransactions(card_id, data) {
  const {start_date, end_date, page_size, page} = data;
  const params = {
    start_date,
    end_date,
    page_size,
    page
  };
  const res = await mapleradAxios.get(`issuing/${card_id}/transactions`, {
    params,
    headers: { 
        accept: 'application/json', 
        'content-type': 'application/json'
     },
  });
  return res.data ?? null;
}

async function fundCard(data) {
  const { card_id, amount } = data;
  const res = await mapleradAxios.post(`issuing/${card_id}/fund`, {
    amount
  }, {
    headers: { 
        accept: 'application/json', 
        'content-type': 'application/json'
     },
  });
  return res.data ?? null;
}

module.exports = {
  createCard,
  getCards,
  getCard,
  freezeCard,
  unfreezeCard,
  getCardTransactions,
  fundCard
};