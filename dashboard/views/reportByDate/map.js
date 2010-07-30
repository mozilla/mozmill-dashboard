function(doc) {
  if (doc.time_start) {
    emit(doc.time_start, doc);
  }
}
