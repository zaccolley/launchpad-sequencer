const LAUNCHPAD_ROW_AMOUNT = 8;

function generatePad() {
  const pad = {
    active: false
  };

  return pad;
}

function generatePads() {
  const padAmount = 8;
  const pads = [];

  for (let i = 0; i < padAmount; i++) {
    const pad = generatePad();
    pads.push(pad);
  }

  return pads;
}

function generateRows() {
  const rowAmount = LAUNCHPAD_ROW_AMOUNT;
  const rows = [];

  for (let i = 0; i < rowAmount; i++) {
    const pads = generatePads();
    rows.push({ pads });
  }

  return rows;
}

function generatePages() {
  const pageAmount = 3;
  const pages = [];

  for (let i = 0; i < pageAmount; i++) {
    const rows = generateRows();
    pages.push({ rows });
  }

  return pages;
}

function generateState(intialBpm, initialAmountOfActivePages) {
  const view = {
    name: 'beats',
    pageNo: 1
  };

  const beats = {
    pages: generatePages(initialAmountOfActivePages)
  };

  return {
    bpm: intialBpm,
    playState: 'stopped',
    view,
    beats
  }
}
