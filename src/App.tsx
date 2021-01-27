import React, {FC, useEffect} from 'react';
import create from 'zustand';
import './App.css';

const apiKey = process.env.REACT_APP_GIPHY_API_KEY;

enum FetchStatus {
  LOADING = 'LOADING',
  ERROR = 'ERROR',
  DONE = 'DONE',
}

type FetchState<T> =
  | { status: FetchStatus.LOADING }
  | { status: FetchStatus.ERROR }
  | { status: FetchStatus.DONE; data: T };

type SearchResponse = {
  data: Array<{images: { fixed_height: { url: string }}}>
}

type Store = {
  selected: string | undefined;
  setSelected: (pokemon: string | undefined) => void;
  pokemonList: FetchState<string[]> | undefined;
  fetchPokemonGifs: (pokemon: string) => void;
  pokemonGifs: { [pokemon: string]: FetchState<SearchResponse> };
}

export const useStore = create<Store>(
  (set): Store => ({
    selected: undefined,
    setSelected: (pokemon: string | undefined) => {
      set({ selected: pokemon });
    },
    pokemonList: undefined,
    pokemonGifs: {},

    fetchPokemonGifs: async (pokemon: string) => {
      const update = (next: FetchState<SearchResponse>) =>
        set(state => ({
          pokemonGifs: {
            ...state.pokemonGifs,
            [pokemon]: next,
          }
        }));
      update({ status: FetchStatus.LOADING });
      const doFetch = async () => {
        const response = await fetch(makeGiphySearchQuery(pokemon));
        if (response.ok) {
          try {
            const json = await response.json();
            update({ status: FetchStatus.DONE, data: json });
          } catch {
            update({ status: FetchStatus.ERROR });
          }
        } else {
          update({ status: FetchStatus.ERROR })
        }
      };
      setTimeout(doFetch, 1000);
    },
  })
)

function makeGiphySearchQuery(query: string) {
  return `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${query}&limit=100&offset=0&rating=g&lang=en`
}


const Loading: FC<{}> = () =>
  <div className="loading">
    <img src="https://media1.giphy.com/media/3oEjI6SIIHBdRxXI40/100w.gif" alt="loading"/>
  </div>

const PokemonPage: FC<{ pokemon: string }> = ({ pokemon }) => {
  const setSelected = useStore(state => state.setSelected);
  const fetchPokemonGifs = useStore(state => state.fetchPokemonGifs);
  const gifsData = useStore(state => state.pokemonGifs[pokemon]);
  useEffect(() => {
    if (gifsData?.status !== FetchStatus.DONE) {
      fetchPokemonGifs(pokemon);
    }
  }, []);
  return (
    <section className="PokemonPage">
      <button onClick={()=> setSelected(undefined)}>&lt;&lt; Back</button>
      <h1>{pokemon}</h1>
      {!gifsData || gifsData.status === FetchStatus.LOADING
        ? <Loading/>
        : gifsData.status === FetchStatus.ERROR
        ? <div>Fetch error</div>
        : <div className="PokemonGifs">
            {gifsData.data.data.map((d, i) => (
              <img key={i} src={d.images.fixed_height.url} alt={pokemon} />
            ))}
          </div>
      }
    </section>
  );
}

function App() {
  const setSelected = useStore(state => state.setSelected);
  const pokemonList = useStore(state => state.pokemonList);
  const selected = useStore(state => state.selected);
  if (selected) {
    return <PokemonPage pokemon={selected}/>
  }
  return (
    <div className="PokemonCards">
      {!pokemonList || pokemonList?.status === FetchStatus.LOADING
        ? <Loading/>
        : pokemonList?.status === FetchStatus.ERROR
        ? <div>Fetch error</div>
        : pokemonList.data.map(name =>
            <div
              key={name} className="PokemonCard button"
              onClick={() => setSelected(name)}
            >
              {name}
            </div>
          )
      }
    </div>
  );
}

export default App;




useStore.setState({pokemonList: {status: FetchStatus.LOADING}});
fetch('/pokemon.json')
  .then((resp) => resp.json())
  .then((data) => {
    useStore.setState({
      pokemonList: {
        status: FetchStatus.DONE,
        data: data
      }
    });
  })
  .catch(err => {
    useStore.setState({pokemonList: {status: FetchStatus.ERROR}});
  });