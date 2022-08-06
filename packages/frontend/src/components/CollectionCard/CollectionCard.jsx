import 'styled-components/macro';
import './CollectionCard.scss';
import { useState } from 'react';
import pluralize from 'pluralize';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { useDeleteCollection } from '../../hooks/graphQLAPI';
import useCurrentUser from '../../auth/useCurrentUser';
import Modal from '../Modal';
import { useCollectionsValue } from '../../contexts/CollectionsContext';

export default function CollectionCard({ collection }) {
  const { isAuthenticated } = useCurrentUser();
  const [, setErrorMessage] = useState(null);
  const [deleteCollection] = useDeleteCollection();
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, dispatch] = useCollectionsValue();

  const onDismissModal = () => setShowDeleteConfirmModal(false);

  const onRequestDelete = () => {
    setShowDeleteConfirmModal(true);
  };

  const onTryDeleteCollection = async () => {
    try {
      if (isAuthenticated) {
        setIsDeleting(true);
        await deleteCollection({
          variables: {
            id: collection.id,
          },
        });
        setIsDeleting(false);
        onDismissModal();
        toast('Collection deleted');
      } else {
        dispatch({
          type: 'DELETE_COLLECTION',
          payload: {
            collectionId: collection.id,
          },
        });
      }
    } catch (err) {
      setErrorMessage('Something went wrong');
    }
  };

  const onClickCard = () => {
    window.location.href = `/collection/${collection.id}`;
  };

  // If you press space or enter it will send you to the collection page (same as click)
  const onCardFocusEnter = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      window.location.href = `/collection/${collection.id}`;
    }
  };

  return (
    /**
     * onClick sends you to the collection page
     * onKeyDown and tabIndex are required by React to allow pages to be navigated by pressing tab
     * tabIndex of 0 allows this div to be tab navigated to
     */
    <div
      className="collection-card"
      css="position: relative"
      onClick={onClickCard}
      onKeyDown={onCardFocusEnter}
      role="link"
      tabIndex={0}
    >
      <div className="custom-column left">
        <h3>
          <Link to={`/collection/${collection.id}`}>{collection.name}</Link>
        </h3>
        <div className="collection-stats">
          <span>
            {pluralize('dataset', collection.datasetIds?.length ?? 0, true)}
          </span>
        </div>
      </div>
      <div className="custom-column right">
        <button
          css={`
            background: none;
            position: absolute;
            right: 4px;
            top: -6px;
            width: auto;
          `}
          onClick={onRequestDelete}
          type="button"
        >
          <FontAwesomeIcon
            css={`
              color: #8eacd1;
              font-size: 15px;
              transition: all 250ms;
              &:hover {
                color: #657790;
              }
            `}
            size="1x"
            icon={faTrash}
          />
        </button>
      </div>
      {showDeleteConfirmModal ? (
        <Modal isOpen onDismiss={onDismissModal}>
          <p css="font-size: 1.4rem">
            Are you sure you want to delete this collection?
          </p>
          <div
            css={`
              display: flex;
              flex: 1;
              justify-content: center;
            `}
          >
            <button
              type="button"
              style={{ marginRight: 8 }}
              disabled={isDeleting}
              onClick={onTryDeleteCollection}
            >
              Delete
            </button>
            <button type="button" onClick={onDismissModal}>
              Cancel
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
