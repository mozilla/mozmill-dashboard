function(doc) {
  if (doc.starttime) {
    emit(doc.starttime, doc);
  }
}
