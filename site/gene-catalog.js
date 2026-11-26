(() => {
  const filterFields = {
    scope: '范围',
    kind: '注释类别',
    role: '功能或结构分组',
    evidence: '证据类型',
    chromosome: '染色体',
    strand: '方向'
  };
  const collator = new Intl.Collator('zh-CN', { numeric: true });
  const normalize = value => value.normalize('NFKC').toLowerCase();

  for (const catalog of document.querySelectorAll('[data-gene-catalog]')) {
    const toolbar = catalog.querySelector('[data-catalog-controls]');
    const tableBody = catalog.querySelector('tbody');
    const rows = Array.from(tableBody.rows, row => ({
      row,
      metadata: row.dataset,
      text: normalize(row.textContent + ' ' + (row.dataset.aliases || ''))
    }));
    const status = catalog.querySelector('[data-catalog-status]');
    const query = document.createElement('input');
    query.type = 'search';
    query.placeholder = '基因名、别名、产物、功能、ID';

    function addControl(name, control) {
      const label = document.createElement('label');
      const caption = document.createElement('span');
      caption.textContent = name;
      label.append(caption, control);
      toolbar.append(label);
    }

    addControl('搜索', query);
    const filters = Object.entries(filterFields).map(([field, label]) => {
      const select = document.createElement('select');
      const values = [...new Set(rows.map(item => item.metadata[field]).filter(Boolean))];
      values.sort(collator.compare);
      select.add(new Option('全部', ''));
      for (const value of values) select.add(new Option(value, value));
      select.dataset.catalogFilter = field;
      addControl(label, select);
      return { field, select };
    });

    const order = document.createElement('select');
    order.add(new Option('基因名称', 'name'));
    order.add(new Option('染色体位置', 'position'));
    addControl('排序', order);
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = '清除筛选';
    toolbar.append(reset);

    function filter() {
      const terms = normalize(query.value).trim().split(/\s+/).filter(Boolean);
      let visible = 0;
      for (const { row, metadata, text } of rows) {
        row.hidden = !terms.every(term => text.includes(term)) ||
          !filters.every(({ field, select }) => !select.value || metadata[field] === select.value);
        if (!row.hidden) visible++;
      }
      status.textContent = `显示 ${visible} / ${rows.length} 条`;
      catalog.querySelector('[data-catalog-empty]').hidden = visible > 0;
    }

    function sort() {
      rows.sort((a, b) => {
        if (order.value === 'position') {
          const chromosome = collator.compare(a.metadata.chromosome || '未知', b.metadata.chromosome || '未知');
          if (chromosome) return chromosome;
          const position = Number(a.metadata.position || Infinity) - Number(b.metadata.position || Infinity);
          if (position) return position;
        }
        return collator.compare(a.metadata.name, b.metadata.name) ||
          collator.compare(a.metadata.record || '', b.metadata.record || '');
      });
      const fragment = document.createDocumentFragment();
      for (const { row } of rows) fragment.append(row);
      tableBody.append(fragment);
    }

    query.addEventListener('input', filter);
    for (const { select } of filters) select.addEventListener('change', filter);
    order.addEventListener('change', sort);
    reset.addEventListener('click', () => {
      query.value = '';
      for (const { select } of filters) select.value = '';
      order.value = 'name';
      sort();
      filter();
      query.focus();
    });
    sort();
    filter();
  }
})();
