# app.rb
require 'sinatra'
require 'json'

@@counter = 0
@@start   = 0
get '/non_overlapping/:start.json' do

  def makeObj
    
    o = { 
      :key => @@counter.to_s + "_key",
      :value => @@counter.to_s + "_value",
      :id => @@counter
    }

    @@counter += 1

    return o
  end

  if (@@start == nil || (params[:start].to_i != @@start))
    @@start = params[:start].to_i
    @@counter = @@start
  end

  arr = []
  (0..9).each do |i|
    arr << makeObj()
  end
  arr.to_json

end

@@counter2 = 0
@@start2 = nil

get '/overlapping/:start/:by.json' do

  def makeObj
    
    o = { 
      :key => @@counter2.to_s + "_key",
      :value => @@counter2.to_s + "_value",
      :id => @@counter2
    }
    @@counter2 += 1
    return o
  end

  if (@@start2 == nil || (params[:start].to_i != @@start2))
    @@start2 = params[:start].to_i
    @@counter2 = @@start2
  end

  if (@@counter2 > @@start2)
    @@counter2 -= params[:by].to_i + 1
  end

  arr = []
  (0..9).each do |i|
    arr << makeObj()
  end
  arr.to_json

end

@@counter3 = 10
get '/non_overlapping_time.json' do

  def makeObj
    o = {
      :someval => rand(100),
      :time => (Time.now() + @@counter3).strftime("%Y/%m/%d %H:%M:%S")
    }
    @@counter3 += 10
    o
  end

  arr = []
  (0..9).each do |i|
    arr << makeObj()
  end
  arr.to_json
end

@@counter4 = 0
get '/updated.json' do
  arr = [
    { :name => 'alpha', :a => @@counter4, :b => @@counter4 * 2 },
    { :name => 'beta', :a => @@counter4 + 1, :b => @@counter4 - 1 },
    { :name => 'delta', :a => @@counter4 + 2, :b => @@counter4 - 2 }
  ]
  @@counter4 += 1
  arr.to_json
end
