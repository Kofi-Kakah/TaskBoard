export default function BoardsLoading() {
  return (
    <main className="boards-dashboard boards-loading" aria-label="Loading boards" aria-busy="true">
      <div className="boards-section-heading">
        <div><span className="ui-skeleton boards-loading-heading" /><span className="ui-skeleton boards-loading-subtitle" /></div>
        <span className="ui-skeleton boards-loading-button" />
      </div>
      <div className="boards-grid">
        {[0, 1, 2, 3].map((card) => <div className="board-card boards-loading-card" key={card}>
          <span className="ui-skeleton boards-loading-title" />
          <span className="ui-skeleton boards-loading-description" />
          <span className="ui-skeleton boards-loading-stats" />
        </div>)}
      </div>
    </main>
  );
}
