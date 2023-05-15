const PAGE_SIZE = 10
let currentPage = 1;
let pokemons = []

function updatePageInfo(currentPage, itemsPerPage, totalItems) {
  $('#pageInfo').empty();
  var startItem = (currentPage - 1) * itemsPerPage + 1;
  var endItem = Math.min(startItem + itemsPerPage - 1, totalItems);

  var currentItems = endItem - startItem + 1;

  var itemInfo = 'Showing ' + currentItems + ' out of ' + totalItems + ' pokemon';

  $('#pageInfo').append(itemInfo);
}

const updatePaginationDiv = (currentPage, numPages) => {
  $('#pagination').empty();

  const totalPages = numPages;
  let startPage, endPage;

  if (totalPages <= 5) {
    startPage = 1;
    endPage = totalPages;
  } else {
    if (currentPage <= 4) {
      startPage = 1;
      endPage = 5;
    } else if (currentPage >= totalPages - 1) {
      startPage = totalPages - 4;
      endPage = totalPages;
    } else {
      startPage = currentPage - 1;
      endPage = currentPage + 1;
    }
  }

  if (currentPage > 1) {
    $('#pagination').append(`
      <button class="prevButton btn btn-primary page ml-1" value="${currentPage - 1}">Prev</button>
    `);
  }

  for (let i = startPage; i <= endPage; i++) {
    $('#pagination').append(`
      <button class="btn btn-primary page ml-1 numberedButtons${i === currentPage ? ' active' : ''}" value="${i}">${i}</button>
    `);
  }

  if (currentPage < totalPages) {
    $('#pagination').append(`
      <button class="nextButton btn btn-primary page ml-1" value="${currentPage + 1}">Next</button>
    `);
  }
}

const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
  selected_pokemons = pokemons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  $('#pokeCards').empty()
  selected_pokemons.forEach(async (pokemon) => {
    const res = await axios.get(pokemon.url)
    $('#pokeCards').append(`
      <div class="pokeCard card" pokeName=${res.data.name}   >
        <h3>${res.data.name.toUpperCase()}</h3> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
        </div>  
        `)
  })
}

const setup = async () => {
  $('#pokeCards').empty()
  let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
  pokemons = response.data.results;

   const typesResponse = await axios.get('https://pokeapi.co/api/v2/type/');
   const types = typesResponse.data.results;

   const typeFiltersContainer = $('#typeFilters');
   types.forEach((type) => {
     typeFiltersContainer.append(`
       <label>
         <input type="checkbox" name="typeCheckbox" value="${type.name}">
         ${type.name}
       </label>
     `);
   });

  paginate(currentPage, PAGE_SIZE, pokemons)
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE)
  updatePaginationDiv(currentPage, numPages)

  updatePageInfo(currentPage, PAGE_SIZE, pokemons.length)

  $('body').on('click', '.pokeCard', async function (e) {
    const pokemonName = $(this).attr('pokeName')
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
    const types = res.data.types.map((type) => type.type.name)
    $('.modal-body').html(`
        <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
        <h3>Abilities</h3>
        <ul>
        ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
        </ul>
        </div>

        <div>
        <h3>Stats</h3>
        <ul>
        ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
        </ul>

        </div>

        </div>
          <h3>Types</h3>
          <ul>
          ${types.map((type) => `<li>${type}</li>`).join('')}
          </ul>
      
        `)
    $('.modal-title').html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
        `)
  })

  $('body').on('click', ".numberedButtons", async function (e) {
    currentPage = Number(e.target.value)
    paginate(currentPage, PAGE_SIZE, pokemons)

    updatePaginationDiv(currentPage, numPages)
  })

  $('body').on('click', ".prevButton", async function (e) {
    currentPage = Number(e.target.value)
    paginate(currentPage, PAGE_SIZE, pokemons)

    updatePageInfo(currentPage, PAGE_SIZE, pokemons.length)

    updatePaginationDiv(currentPage, numPages)
  })

  $('body').on('click', ".nextButton", async function (e) {
    currentPage = Number(e.target.value)
    paginate(currentPage, PAGE_SIZE, pokemons)

    updatePageInfo(currentPage, PAGE_SIZE, pokemons.length)

    updatePaginationDiv(currentPage, numPages)
  })

  let selectedTypes = [];
  $('body').on('change', 'input[name="typeCheckbox"]', async function() {
    const checkedType = $(this).val();

    if ($(this).is(':checked')) {
      selectedTypes.push(checkedType);
    } else {
      let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
      pokemons = response.data.results;
      selectedTypes = selectedTypes.filter((type) => type !== checkedType);
    }
    console.log(selectedTypes)

    const filteredPokemon = await Promise.all(pokemons.map(async (pokemon) => {
      const res = await axios.get(pokemon.url);
      const pokemonData = res.data;
      const types = pokemonData.types.map((types) => types.type.name);
      return {
        ...pokemon,
        types: types
      };
    }));
    
    const result = filteredPokemon.filter((pokemon) => {
      return selectedTypes.every((type) => pokemon.types.includes(type));
    });
    
    console.log(result);

    pokemons = result;

    paginate(1, PAGE_SIZE, result);
    updatePaginationDiv(1, Math.ceil(result.length / PAGE_SIZE));
    updatePageInfo(1, PAGE_SIZE, result.length); 
  
  })
}


$(document).ready(setup)

