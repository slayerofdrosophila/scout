import './CollectionPage.scss';
import { useParams } from 'react-router-dom';
import {
  EmailShareButton,
  FacebookShareButton,
  TwitterShareButton,
  EmailIcon,
  FacebookIcon,
  TwitterIcon,
} from 'react-share';
import usePageView from '../../hooks/analytics';
import useClipboard from '../../hooks/useClipboard';
import Dataset from '../../components/Dataset/Dataset';
import Breadcrumb from '../../components/Breadcrumb/Breadcrumb';
import { useCollection, useDatasetsFromIds } from '../../hooks/graphQLAPI';
import { useUserCollections } from '../../hooks/collections';
import { DISABLE_USER_ACCOUNTS } from '../../flags';

const EMPTY_COLLECTION = {
  datasetIDs: [],
  description: '',
  name: '',
};

function getShareableURL(collectionName, datasetIDs) {
  const urlOrigin = window.location.origin;
  const datasetIDsStr = datasetIDs.join(',');
  return `${urlOrigin}/collection/${collectionName}/${datasetIDsStr}`;
}

export default function CollectionPage() {
  usePageView();
  const { name, datasetIDs: datasetIDsFromURL, id } = useParams();
  const loadingCollectionFromURL = !!datasetIDsFromURL;

  const [{ collections }] = useUserCollections();
  const { loading, data, error } = useCollection(id);

  // first try to load a collection to get the dataset ids to load
  let collection = DISABLE_USER_ACCOUNTS
    ? collections.find(col => col.id === id)
    : data.collection;

  let datasetIDsToLoad;
  if (datasetIDsFromURL === undefined) {
    datasetIDsToLoad = collection ? collection.datasetIDs : [];
  } else {
    datasetIDsToLoad = datasetIDsFromURL.split(',');
  }

  const datasets =
    useDatasetsFromIds(datasetIDsToLoad).data?.datasetsByIds || [];

  if (collection === undefined && !loadingCollectionFromURL) {
    // load something empty by default until we've retrieved the collection
    collection = EMPTY_COLLECTION;
  }

  if (loadingCollectionFromURL) {
    collection = {
      name,
      datasetIDs: datasetIDsToLoad,
      description: 'Shared collection',
    };
  }

  const { description, name: collectionName } = collection;

  const shareableURL = getShareableURL(collection.name, datasetIDsToLoad);
  const [isCopied, setCopied] = useClipboard(shareableURL);

  if (loading || collections.length === 0) {
    return <p>Loading...</p>;
  }

  if (
    (error && !DISABLE_USER_ACCOUNTS) ||
    (DISABLE_USER_ACCOUNTS &&
      collections.length >= 1 &&
      collection === undefined)
  ) {
    return <p>Something went wrong</p>;
  }

  return (
    <div className="collection-page">
      <div className="collection-details">
        <section>
          <Breadcrumb currentPage="Collections" />
        </section>
        <section>
          <h2>{collectionName}</h2>
          {description && <h3>{description}</h3>}
          <p>
            {datasets.length} dataset
            {datasets.length > 1 ? 's' : ''}
          </p>
        </section>
        <div>
          <h3>Share this collection:</h3>
          <p className="dataset-url">{shareableURL} </p>
          <button type="button" onClick={setCopied}>
            Copy link
          </button>
          <span>{isCopied ? 'Copied!' : ' '} </span>
          <p className="share-icons">
            <FacebookShareButton url={shareableURL}>
              <FacebookIcon size={36} />
            </FacebookShareButton>{' '}
            <TwitterShareButton url={shareableURL}>
              <TwitterIcon size={36} />
            </TwitterShareButton>
            <EmailShareButton url={shareableURL}>
              <EmailIcon size={36} />
            </EmailShareButton>
          </p>
        </div>
      </div>
      <div className="collection-content">
        {datasets.map(dataset => (
          <Dataset
            showCollectionButtons={false}
            viewInOpenPortal
            key={dataset.id}
            dataset={dataset}
          />
        ))}
      </div>
    </div>
  );
}
