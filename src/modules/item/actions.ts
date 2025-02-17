import { action } from 'typesafe-actions'
import { ChainId } from '@dcl/schemas'
import { buildTransactionPayload } from 'decentraland-dapps/dist/modules/transaction/utils'
import { PaginationStats } from 'lib/api/pagination'
import { FetchCollectionsParams } from 'lib/api/builder'
import { Collection } from 'modules/collection/types'
import { BuiltFile, Item, Rarity } from './types'

// Fetch items

export const FETCH_ITEMS_REQUEST = '[Request] Fetch Items'
export const FETCH_ITEMS_SUCCESS = '[Success] Fetch Items'
export const FETCH_ITEMS_FAILURE = '[Failure] Fetch Items'

export const fetchItemsRequest = (address: string, params?: { limit: number; page: number }) =>
  action(FETCH_ITEMS_REQUEST, { address, params })
export const fetchItemsSuccess = (items: Item[], paginationStats: PaginationStats, address: string) =>
  action(FETCH_ITEMS_SUCCESS, { items, paginationStats, paginationIndex: address })
export const fetchItemsFailure = (error: string) => action(FETCH_ITEMS_FAILURE, { error })

export type FetchItemsRequestAction = ReturnType<typeof fetchItemsRequest>
export type FetchItemsSuccessAction = ReturnType<typeof fetchItemsSuccess>
export type FetchItemsFailureAction = ReturnType<typeof fetchItemsFailure>

// Fetch Orphan items

export const FETCH_ORPHAN_ITEM_REQUEST = '[Request] Fetch Orphan Item'
export const FETCH_ORPHAN_ITEM_SUCCESS = '[Success] Fetch Orphan Item'
export const FETCH_ORPHAN_ITEM_FAILURE = '[Failure] Fetch Orphan Item'

export const fetchOrphanItemRequest = (address: string) => action(FETCH_ORPHAN_ITEM_REQUEST, { address })
export const fetchOrphanItemSuccess = (hasUserOrphanItems: boolean) => action(FETCH_ORPHAN_ITEM_SUCCESS, { hasUserOrphanItems })
export const fetchOrphanItemFailure = (error: string) => action(FETCH_ORPHAN_ITEM_FAILURE, { error })

export type FetchOrphanItemRequestAction = ReturnType<typeof fetchOrphanItemRequest>
export type FetchOrphanItemSuccessAction = ReturnType<typeof fetchOrphanItemSuccess>
export type FetchOrphanItemFailureAction = ReturnType<typeof fetchOrphanItemFailure>

// Fetch item

export const FETCH_ITEM_REQUEST = '[Request] Fetch Item'
export const FETCH_ITEM_SUCCESS = '[Success] Fetch Item'
export const FETCH_ITEM_FAILURE = '[Failure] Fetch Item'

export const fetchItemRequest = (id: string) => action(FETCH_ITEM_REQUEST, { id })
export const fetchItemSuccess = (id: string, item: Item) => action(FETCH_ITEM_SUCCESS, { id, item })
export const fetchItemFailure = (id: string, error: string) => action(FETCH_ITEM_FAILURE, { id, error })

export type FetchItemRequestAction = ReturnType<typeof fetchItemRequest>
export type FetchItemSuccessAction = ReturnType<typeof fetchItemSuccess>
export type FetchItemFailureAction = ReturnType<typeof fetchItemFailure>

// Fetch collection item

export const FETCH_COLLECTION_ITEMS_REQUEST = '[Request] Fetch Collection Items'
export const FETCH_COLLECTION_ITEMS_SUCCESS = '[Success] Fetch Collection Items'
export const FETCH_COLLECTION_ITEMS_FAILURE = '[Failure] Fetch Collection Items'

export const fetchCollectionItemsRequest = (
  collectionId: string,
  {
    page,
    limit,
    status,
    synced,
    overridePaginationData = true
  }: Pick<FetchCollectionsParams, 'limit' | 'status' | 'synced'> & {
    page?: number | number[]
    overridePaginationData?: boolean
  } = {}
) => action(FETCH_COLLECTION_ITEMS_REQUEST, { collectionId, overridePaginationData, options: { limit, status, synced, page } })
export const fetchCollectionItemsSuccess = (collectionId: string, items: Item[], paginationStats?: PaginationStats) =>
  action(FETCH_COLLECTION_ITEMS_SUCCESS, { items, paginationIndex: collectionId, paginationStats })
export const fetchCollectionItemsFailure = (collectionId: string, error: string) =>
  action(FETCH_COLLECTION_ITEMS_FAILURE, { collectionId, error })

export type FetchCollectionItemsRequestAction = ReturnType<typeof fetchCollectionItemsRequest>
export type FetchCollectionItemsSuccessAction = ReturnType<typeof fetchCollectionItemsSuccess>
export type FetchCollectionItemsFailureAction = ReturnType<typeof fetchCollectionItemsFailure>

export const FETCH_COLLECTION_THUMBNAILS_REQUEST = '[Request] Fetch Collection Thumbnails'
export const FETCH_COLLECTION_THUMBNAILS_SUCCESS = '[Success] Fetch Collection Thumbnails'
export const FETCH_COLLECTION_THUMBNAILS_FAILURE = '[Failure] Fetch Collection Thumbnails'

export const fetchCollectionThumbnailsRequest = (collectionId: string) => action(FETCH_COLLECTION_THUMBNAILS_REQUEST, { collectionId })
export const fetchCollectionThumbnailsSuccess = (collectionId: string, items: Item[]) =>
  action(FETCH_COLLECTION_THUMBNAILS_SUCCESS, { collectionId, items })
export const fetchCollectionThumbnailsFailure = (collectionId: string, error: string) =>
  action(FETCH_COLLECTION_THUMBNAILS_FAILURE, { collectionId, error })

export type FetchCollectionThumbnailsRequestAction = ReturnType<typeof fetchCollectionThumbnailsRequest>
export type FetchCollectionThumbnailsSuccessAction = ReturnType<typeof fetchCollectionThumbnailsSuccess>
export type FetchCollectionThumbnailsFailureAction = ReturnType<typeof fetchCollectionThumbnailsFailure>

// Save items

export const SAVE_ITEM_REQUEST = '[Request] Save Item'
export const SAVE_ITEM_SUCCESS = '[Success] Save Item'
export const SAVE_ITEM_FAILURE = '[Failure] Save Item'

export const saveItemRequest = (item: Item, contents: Record<string, Blob>) => action(SAVE_ITEM_REQUEST, { item, contents })
export const saveItemSuccess = (item: Item, contents: Record<string, Blob>) => action(SAVE_ITEM_SUCCESS, { item, contents })
export const saveItemFailure = (item: Item, contents: Record<string, Blob>, error: string) =>
  action(SAVE_ITEM_FAILURE, { item, contents, error })

export type SaveItemRequestAction = ReturnType<typeof saveItemRequest>
export type SaveItemSuccessAction = ReturnType<typeof saveItemSuccess>
export type SaveItemFailureAction = ReturnType<typeof saveItemFailure>

// Save multiple items

export const SAVE_MULTIPLE_ITEMS_REQUEST = '[Request] Save Multiple Items'
export const SAVE_MULTIPLE_ITEMS_SUCCESS = '[Success] Save Multiple Items'
export const SAVE_MULTIPLE_ITEMS_FAILURE = '[Failure] Save Multiple Items'
export const SAVE_MULTIPLE_ITEMS_CANCELLED = '[Cancelled] Save Multiple Items'
export const CANCEL_SAVE_MULTIPLE_ITEMS = '[Cancel] Save Multiple Items'
export const CLEAR_SAVE_MULTIPLE_ITEMS = '[Clear] Save Multiple Items'

export const saveMultipleItemsRequest = (builtFiles: BuiltFile<Blob>[]) => action(SAVE_MULTIPLE_ITEMS_REQUEST, { builtFiles })
export const saveMultipleItemsSuccess = (items: Item[], savedFileNames: string[], notSavedFileNames: string[]) =>
  action(SAVE_MULTIPLE_ITEMS_SUCCESS, { items, savedFileNames, notSavedFileNames })
export const saveMultipleItemsCancelled = (
  items: Item[],
  savedFileNames: string[],
  notSavedFileNames: string[],
  cancelledFileNames: string[]
) => action(SAVE_MULTIPLE_ITEMS_CANCELLED, { items, savedFileNames, notSavedFileNames, cancelledFileNames })

export const cancelSaveMultipleItems = () => action(CANCEL_SAVE_MULTIPLE_ITEMS)
export const clearSaveMultipleItems = () => action(CLEAR_SAVE_MULTIPLE_ITEMS)

export type SaveMultipleItemsRequestAction = ReturnType<typeof saveMultipleItemsRequest>
export type SaveMultipleItemsSuccessAction = ReturnType<typeof saveMultipleItemsSuccess>
export type SaveMultipleItemsCancelledAction = ReturnType<typeof saveMultipleItemsCancelled>
export type CancelSaveMultipleItemsAction = ReturnType<typeof cancelSaveMultipleItems>
export type ClearStateSaveMultipleItemsAction = ReturnType<typeof clearSaveMultipleItems>

// Edit On Chain Sale Data

export const SET_PRICE_AND_BENEFICIARY_REQUEST = '[Request] Set price and beneficiary'
export const SET_PRICE_AND_BENEFICIARY_SUCCESS = '[Success] Set price and beneficiary'
export const SET_PRICE_AND_BENEFICIARY_FAILURE = '[Failure] Set price and beneficiary'

export const setPriceAndBeneficiaryRequest = (itemId: string, price: string, beneficiary: string) =>
  action(SET_PRICE_AND_BENEFICIARY_REQUEST, { itemId, price, beneficiary })
export const setPriceAndBeneficiarySuccess = (item: Item, chainId: ChainId, txHash: string) =>
  action(SET_PRICE_AND_BENEFICIARY_SUCCESS, {
    item,
    ...buildTransactionPayload(chainId, txHash, { item })
  })
export const setPriceAndBeneficiaryFailure = (itemId: string, price: string, beneficiary: string, error: string) =>
  action(SET_PRICE_AND_BENEFICIARY_FAILURE, { itemId, price, beneficiary, error })

export type SetPriceAndBeneficiaryRequestAction = ReturnType<typeof setPriceAndBeneficiaryRequest>
export type SetPriceAndBeneficiarySuccessAction = ReturnType<typeof setPriceAndBeneficiarySuccess>
export type SetPriceAndBeneficiaryFailureAction = ReturnType<typeof setPriceAndBeneficiaryFailure>

// Delete items

export const DELETE_ITEM_REQUEST = '[Request] Delete Item'
export const DELETE_ITEM_SUCCESS = '[Success] Delete Item'
export const DELETE_ITEM_FAILURE = '[Failure] Delete Item'

export const deleteItemRequest = (item: Item) => action(DELETE_ITEM_REQUEST, { item })
export const deleteItemSuccess = (item: Item) => action(DELETE_ITEM_SUCCESS, { item })
export const deleteItemFailure = (item: Item, error: string) => action(DELETE_ITEM_FAILURE, { item, error })

export type DeleteItemRequestAction = ReturnType<typeof deleteItemRequest>
export type DeleteItemSuccessAction = ReturnType<typeof deleteItemSuccess>
export type DeleteItemFailureAction = ReturnType<typeof deleteItemFailure>

// Set Collection

export const SET_COLLECTION = 'Set Collection'
export const setCollection = (item: Item, collectionId: string | null) => action(SET_COLLECTION, { item, collectionId })
export type SetCollectionAction = ReturnType<typeof setCollection>

// Set Item Collection

export const SET_ITEM_COLLECTION = 'Set Item Collection'

export const setItemCollection = (item: Item, collectionId: string) => action(SET_ITEM_COLLECTION, { item, collectionId })
export type SetItemCollectionAction = ReturnType<typeof setItemCollection>

// Set Token Ids

export const SET_ITEMS_TOKEN_ID_REQUEST = '[Request] Set Items Token Id'
export const SET_ITEMS_TOKEN_ID_SUCCESS = '[Success] Set Items Token Id'
export const SET_ITEMS_TOKEN_ID_FAILURE = '[Failure] Set Items Token Id'

export const setItemsTokenIdRequest = (collection: Collection, items: Item[]) => action(SET_ITEMS_TOKEN_ID_REQUEST, { collection, items })
export const setItemsTokenIdSuccess = (items: Item[]) => action(SET_ITEMS_TOKEN_ID_SUCCESS, { items })
export const setItemsTokenIdFailure = (collection: Collection, items: Item[], error: string, errorCode: number) =>
  action(SET_ITEMS_TOKEN_ID_FAILURE, { collection, items, error, errorCode })

export type SetItemsTokenIdRequestAction = ReturnType<typeof setItemsTokenIdRequest>
export type SetItemsTokenIdSuccessAction = ReturnType<typeof setItemsTokenIdSuccess>
export type SetItemsTokenIdFailureAction = ReturnType<typeof setItemsTokenIdFailure>

// Fetch rarities

export const FETCH_RARITIES_REQUEST = '[Request] Fetch Rarities'
export const FETCH_RARITIES_SUCCESS = '[Success] Fetch Rarities'
export const FETCH_RARITIES_FAILURE = '[Failure] Fetch Rarities'

export const fetchRaritiesRequest = () => action(FETCH_RARITIES_REQUEST)
export const fetchRaritiesSuccess = (rarities: Rarity[]) => action(FETCH_RARITIES_SUCCESS, { rarities })
export const fetchRaritiesFailure = (error: string) => action(FETCH_RARITIES_FAILURE, { error })

export type FetchRaritiesRequestAction = ReturnType<typeof fetchRaritiesRequest>
export type FetchRaritiesSuccessAction = ReturnType<typeof fetchRaritiesSuccess>
export type FetchRaritiesFailureAction = ReturnType<typeof fetchRaritiesFailure>

// Rescue items

export const RESCUE_ITEMS_REQUEST = '[Request] Rescue items'
export const RESCUE_ITEMS_SUCCESS = '[Success] Rescue items'
export const RESCUE_ITEMS_CHUNK_SUCCESS = '[Chunk] Rescue items'
export const RESCUE_ITEMS_FAILURE = '[Failure] Rescue items'

export const rescueItemsRequest = (collection: Collection, items: Item[], contentHashes: string[]) =>
  action(RESCUE_ITEMS_REQUEST, { collection, items, contentHashes })
export const rescueItemsChunkSuccess = (collection: Collection, items: Item[], contentHashes: string[], chainId: ChainId, txHash: string) =>
  action(RESCUE_ITEMS_CHUNK_SUCCESS, {
    collection,
    contentHashes,
    txHash,
    items,
    ...buildTransactionPayload(chainId, txHash, {
      count: items.length,
      collectionId: collection.id,
      collectionName: collection.name
    })
  })
export const rescueItemsSuccess = (collection: Collection, items: Item[], contentHashes: string[], chainId: ChainId, txHashes: string[]) =>
  action(RESCUE_ITEMS_SUCCESS, {
    collection,
    items,
    contentHashes,
    txHashes,
    chainId
  })
export const rescueItemsFailure = (collection: Collection, items: Item[], contentHashes: string[], error: string) =>
  action(RESCUE_ITEMS_FAILURE, { collection, items, contentHashes, error })

export type RescueItemsRequestAction = ReturnType<typeof rescueItemsRequest>
export type RescueItemsSuccessAction = ReturnType<typeof rescueItemsSuccess>
export type RescueItemsChunkSuccessAction = ReturnType<typeof rescueItemsChunkSuccess>
export type RescueItemsFailureAction = ReturnType<typeof rescueItemsFailure>

// Reset Item

export const RESET_ITEM_REQUEST = '[Request] Reset item'
export const RESET_ITEM_SUCCESS = '[Success] Reset item'
export const RESET_ITEM_FAILURE = '[Failure] Reset item'

export const resetItemRequest = (itemId: string) => action(RESET_ITEM_REQUEST, { itemId })
export const resetItemSuccess = (itemId: string) => action(RESET_ITEM_SUCCESS, { itemId })
export const resetItemFailure = (itemId: string, error: string) => action(RESET_ITEM_FAILURE, { itemId, error })

export type ResetItemRequestAction = ReturnType<typeof resetItemRequest>
export type ResetItemSuccessAction = ReturnType<typeof resetItemSuccess>
export type ResetItemFailureAction = ReturnType<typeof resetItemFailure>

// Download Item

export const DOWNLOAD_ITEM_REQUEST = '[Request] Download item'
export const DOWNLOAD_ITEM_SUCCESS = '[Success] Download item'
export const DOWNLOAD_ITEM_FAILURE = '[Failure] Download item'

export const downloadItemRequest = (itemId: string) => action(DOWNLOAD_ITEM_REQUEST, { itemId })
export const downloadItemSuccess = (itemId: string) => action(DOWNLOAD_ITEM_SUCCESS, { itemId })
export const downloadItemFailure = (itemId: string, error: string) => action(DOWNLOAD_ITEM_FAILURE, { itemId, error })

export type DownloadItemRequestAction = ReturnType<typeof downloadItemRequest>
export type DownloadItemSuccessAction = ReturnType<typeof downloadItemSuccess>
export type DownloadItemFailureAction = ReturnType<typeof downloadItemFailure>
