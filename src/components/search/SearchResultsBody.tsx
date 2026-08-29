"use client";

import { Loader2 } from "lucide-react";
import { WorkResultCard } from "@/components/browse/WorkResultCard";
import { ReviewResultCard } from "@/components/browse/ReviewResultCard";
import { DiscoverProfileCard } from "@/components/discovery/DiscoverProfileCard";
import { ListResultCard } from "@/components/search/ListResultCard";
import { SearchHeroMatches } from "@/components/search/SearchHeroMatches";
import { SearchResultSection } from "@/components/search/SearchResultSection";
import { RESULTS_GRID_CLASS, WORKS_REVIEWS_GRID_CLASS } from "@/components/search/search-layout";
import { searchWorkToBrowseItem } from "@/lib/search-browse-adapter";
import type { BrowseWorkItem } from "@/types/browse";
import type {
  SearchListHit,
  SearchResponse,
  SearchResultType,
  SearchSort,
  SearchWorkHit,
} from "@/types/search";
import type { ReviewListItem } from "@/types/review";
import type { UserSearchResult } from "@/services/user.service";

interface SearchResultsBodyProps {
  result: SearchResponse;
  visibleWorks: SearchWorkHit[];
  filters: {
    type: SearchResultType;
    sort: SearchSort;
  };
  isLoggedIn: boolean;
  currentUserId?: string;
  paging: boolean;
  hasMore: boolean;
  activeLoaded: number;
  activeTotal: number;
  isAllView: boolean;
  pagingKind: "works" | "reviews" | "people" | "lists";
  onViewAll: (type: SearchResultType) => void;
  onPreviewWork: (work: BrowseWorkItem) => void;
  onWorkPeek: (work: SearchWorkHit) => void;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

export function SearchResultsBody({
  result,
  visibleWorks,
  filters,
  isLoggedIn,
  currentUserId,
  paging,
  hasMore,
  activeLoaded,
  activeTotal,
  isAllView,
  pagingKind,
  onViewAll,
  onPreviewWork,
  onWorkPeek,
  sentinelRef,
}: SearchResultsBodyProps) {
  const heroWorks = visibleWorks.slice(0, 5);
  const showHero =
    visibleWorks.length > 0 && (isAllView || pagingKind === "works");
  const gridWorks = showHero ? visibleWorks.slice(5) : visibleWorks;

  const renderWorksGrid = (
    works: SearchWorkHit[],
    priorityCount = 6,
    startIndex = 0,
  ) => (
    <div className={WORKS_REVIEWS_GRID_CLASS}>
      {works.map((work, index) => {
        const browseWork = searchWorkToBrowseItem(work, filters.sort);
        return (
          <WorkResultCard
            key={work.id}
            work={browseWork}
            priority={startIndex + index < priorityCount}
            onPreview={() => onPreviewWork(browseWork)}
          />
        );
      })}
    </div>
  );

  const renderReviewsGrid = (reviews: ReviewListItem[], priorityCount = 6) => (
    <div className={WORKS_REVIEWS_GRID_CLASS}>
      {reviews.map((review, index) => (
        <ReviewResultCard
          key={review.id}
          review={review}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );

  const renderPeopleGrid = (people: UserSearchResult[]) => (
    <div className={RESULTS_GRID_CLASS}>
      {people.map((person) => (
        <DiscoverProfileCard
          key={person.id}
          profile={person}
          isLoggedIn={isLoggedIn}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );

  const renderListsShelf = (lists: SearchListHit[]) => (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
      {lists.map((list) => (
        <ListResultCard key={list.id} list={list} className="lg:min-w-0" />
      ))}
    </div>
  );

  if (isAllView) {
    return (
      <div className="space-y-10">
        {visibleWorks.length > 0 ? (
          <>
            <SearchHeroMatches works={heroWorks} onPreview={onWorkPeek} />
            {gridWorks.length > 0 ? (
              <SearchResultSection
                title="Works"
                shown={visibleWorks.length}
                total={result.totals.works}
                onViewAll={() => onViewAll("works")}
              >
                {renderWorksGrid(gridWorks)}
              </SearchResultSection>
            ) : null}
          </>
        ) : null}

        {result.reviews.length > 0 ? (
          <SearchResultSection
            title="Reviews"
            subtitle="Community voices matching your query"
            shown={result.reviews.length}
            total={result.totals.reviews}
            onViewAll={() => onViewAll("reviews")}
          >
            {renderReviewsGrid(result.reviews)}
          </SearchResultSection>
        ) : null}

        {result.people.length > 0 ? (
          <SearchResultSection
            title="Readers"
            shown={result.people.length}
            total={result.totals.people}
            onViewAll={() => onViewAll("people")}
          >
            {renderPeopleGrid(result.people)}
          </SearchResultSection>
        ) : null}

        {result.lists.length > 0 ? (
          <SearchResultSection
            title="Curated lists"
            subtitle="Stacks from the community"
            shown={result.lists.length}
            total={result.totals.lists}
            onViewAll={() => onViewAll("lists")}
          >
            {renderListsShelf(result.lists)}
          </SearchResultSection>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {pagingKind === "works" && visibleWorks.length > 0 ? (
        <>
          {showHero ? (
            <SearchHeroMatches works={heroWorks} onPreview={onWorkPeek} />
          ) : null}
          {gridWorks.length > 0 ? renderWorksGrid(gridWorks, 6) : null}
        </>
      ) : null}

      {pagingKind === "reviews" && result.reviews.length > 0
        ? renderReviewsGrid(result.reviews)
        : null}

      {pagingKind === "people" && result.people.length > 0
        ? renderPeopleGrid(result.people)
        : null}

      {pagingKind === "lists" && result.lists.length > 0
        ? renderListsShelf(result.lists)
        : null}

      <div ref={sentinelRef} className="h-px" aria-hidden />

      {paging ? (
        <p className="flex items-center justify-center gap-2 py-4 text-xs text-[#1A1224]/50">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Loading more results…
        </p>
      ) : hasMore ? (
        <p className="py-4 text-center text-xs text-[#1A1224]/45">
          Scroll for more · {activeLoaded.toLocaleString()} of{" "}
          {activeTotal.toLocaleString()} shown
        </p>
      ) : activeTotal > 0 && !isAllView ? (
        <p className="py-4 text-center text-xs text-[#1A1224]/45">
          All {activeTotal.toLocaleString()} results loaded
        </p>
      ) : null}
    </div>
  );
}
