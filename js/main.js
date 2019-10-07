(function (window) {
  'use strict';

  let resultItems = [];
  const itemsPerPage = 3;
  const apiBaseUrl = 'http://api.tvmaze.com/';

  const tvMazeApiService = {
    requestToEndpoint(endpoint) {
      return new Promise((resolve, reject) => {
        window.fetch(`${apiBaseUrl}${endpoint}`).then(res => {
          if (res.status === 200) {
            return res.json().then(resolve).catch(reject);
          }
          return reject(res);
        }).catch(err => {
          reject(err);
        });
      });
    },
    search(searchQuery) {
      return this.requestToEndpoint(`search/shows?q=${searchQuery}`);
    },
    getCasts(castId) {
      return this.requestToEndpoint(`shows/${castId}/cast`);
    },
  };

  const appService = {
    searchResult(searchQuery) {
      resultItems = [];
      return tvMazeApiService.search(searchQuery).then(data => {
        if (data.length > 0) {
          resultItems = data;
        }
      });
    },
    renderResult(items) {
      const contentBlock = window.document.getElementById('content');
      contentBlock.innerHTML = '';
      items.forEach((item, index) => {
        let row = contentBlock.insertRow();
        let cellName = row.insertCell();

        cellName.appendChild(window.document.createTextNode(item.show.name));
        let cellCast = row.insertCell();
        let table = window.document.createElement('table');

        tvMazeApiService.getCasts(item.show.id).then(casts => {
          if (casts.length > 0) {
            // Sorting results
            casts.sort(function (a, b) {
              if (!a.person.birthday) {
                return 1;
              } else if (!b.person.birthday) {
                return -1;
              }
              return (new Date(b.person.birthday).getTime()) - (new Date(a.person.birthday).getTime());
            });
            casts.forEach(cast => {
              let row = table.insertRow();

              row.insertCell().appendChild(
                window.document.createTextNode(cast.person.id)
              );
              row.insertCell().appendChild(
                window.document.createTextNode(cast.person.name)
              );
              row.insertCell().appendChild(
                window.document.createTextNode(cast.person.birthday ? cast.person.birthday : ' - ')
              );
            });
            cellCast.appendChild(table);
          }
        });
      });
    },
    renderPagination(items) {
      window.document.getElementById('pagination-block').innerHTML = '';
      const pages = Math.ceil(items.length / itemsPerPage);
      for (let i = 1; i <= pages; i++) {
        const a = window.document.createElement('a');
        a.setAttribute('data-page', String(i));
        a.setAttribute('class', 'page-link');
        a.setAttribute('href', '#');
        a.appendChild(window.document.createTextNode(String(i)));

        const li = window.document.createElement('li');
        li.setAttribute('class', 'page-item');
        if (i === 1) {
          li.setAttribute('class', 'page-item active')
        }
        li.appendChild(a);
        window.document.getElementById('pagination-block').appendChild(li);
      }
    }
  };

  window.document.getElementById('search-btn')
    .addEventListener('click', () => {
      const searchQuery = window.document.getElementById('search-input').value.trim();
      appService.searchResult(searchQuery).then(() => {
        if (resultItems.length > 0) {
          appService.renderPagination(resultItems);
          appService.renderResult(resultItems.slice(0, itemsPerPage))
        } else {
          alert('No result... :( Try search for something else!');
        }
      });
    });

  window.document.getElementById('pagination-block')
    .addEventListener('click', event => {
      let links = document.querySelectorAll('#pagination-block .active');
      for (let i = 0; i < links.length; i++) {
        links[i].classList.remove('active')
      }
      event.target.parentNode.classList.add('active');
      const page = event.target.getAttribute('data-page');
      const offset = (parseInt(page, 10) - 1) * itemsPerPage;
      appService.renderResult(resultItems.slice(offset, offset + itemsPerPage));
    });
}(window));
