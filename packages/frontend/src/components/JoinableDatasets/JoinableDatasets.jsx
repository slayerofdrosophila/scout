import { useState, useEffect, useMemo } from 'react';
import { getUniqueEntries } from '../../utils/socrata';
import { useJoinableDatasetsPaged } from '../../hooks/graphQLAPI';
import './JoinableDatasets.scss';
import { usePagination } from '../../hooks/pagination';
import JoinColumn from '../JoinColumn/JoinColumn';

const JOINABLE_DATASETS_PAGE_SIZE = 10;

export function JoinableDatasets({ column, global, dataset }) {
  const [pageNo, { pageButtons }] = usePagination({
    totalCount: column.joinSuggestionCount,
    perPage: JOINABLE_DATASETS_PAGE_SIZE,
  });

  const { data, loading, error } = useJoinableDatasetsPaged(
    column.id,
    global,
    JOINABLE_DATASETS_PAGE_SIZE,
    pageNo * JOINABLE_DATASETS_PAGE_SIZE,
  );

  const [overlapLookup, setOverlapLookup] = useState(new Map());

  const pagedJoins = useMemo(
    () => (data ? data.datasetColumn.joinSuggestions : []),
    [data],
  );

  // query for the joinable dataset ids to figure out the % match
  useEffect(() => {
    if (column && column.joinSuggestionCount > 0) {
      getUniqueEntries(dataset, column).then(parentUniques => {
        pagedJoins.forEach(joinableColumn =>
          getUniqueEntries(
            joinableColumn.column.dataset,
            joinableColumn.column,
          ).then(otherUniques => {
            const uniqueVals = new Set(otherUniques);
            const overlapObj = {
              datasetId: joinableColumn.column.dataset.id,
              columnField: joinableColumn.column.field,
              parentUniquesCount: parentUniques.length,
              matches: parentUniques.filter(v => uniqueVals.has(v)),
            };

            setOverlapLookup(prevMap => {
              const clonedMap = new Map([...prevMap.entries()]);
              return clonedMap.set(overlapObj.datasetId, overlapObj);
            });
          }),
        );
      });
    }
  }, [column, pagedJoins, dataset]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Something went wrong</p>;
  }

  return (
    <div className="columns-suggestions-matches">
      <h3 style={{ textTransform: 'uppercase' }}>Matching datasets</h3>
      {pagedJoins && pagedJoins.length > 0 ? (
        <ul>
          {pagedJoins.map(join => {
            const overlapObj = overlapLookup.get(join.column.dataset.id);
            const matches = overlapObj?.matches || [];
            return (
              <li key={join.column.dataset.id}>
                <JoinColumn
                  dataset={join.column.dataset}
                  matches={matches}
                  matchPC={
                    overlapObj
                      ? matches.length / overlapObj.parentUniquesCount
                      : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <div>No matching datasets found</div>
      )}
      {pagedJoins &&
      pagedJoins.length > 0 &&
      column.joinSuggestionCount > JOINABLE_DATASETS_PAGE_SIZE
        ? pageButtons
        : null}
    </div>
  );
}
